# Layout Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first browser editor for multi-page image layouts with a shared asset library.

**Architecture:** A React application stores project metadata, page layouts, and uploaded image Blobs in IndexedDB. Focused state modules handle document changes, history, import/export, and cross-window notifications; canvas and panel components consume those modules without owning persistent state.

**Tech Stack:** Vite, React, TypeScript, Vitest, fake-indexeddb, JSZip, dnd-kit, react-moveable.

**Spec:** `docs/superpowers/specs/2026-10-14-layout-editor-design.md`

## Global Constraints

- Store all project data locally in IndexedDB; do not add accounts or cloud synchronization.
- Use BroadcastChannel only for same-browser, same-device window synchronization.
- Keep the editor canvas-first; no coordinate inputs or complex property panel.
- Deleting an element must never delete the referenced shared asset.
- Export a ZIP containing `project.json` and `assets/`; imported ZIP projects are created as new projects.
- Retain at most 50 layout-history snapshots per page.

## Review Focus

- Invalid or non-ZIP imports display an error and leave the current project unchanged.
- A deleted canvas element leaves its image asset available for reuse.
- Hidden and locked elements cannot accidentally be selected or transformed.
- Images with transparency remain transparent after asset upload and project round-trip export/import.
- A second window receives saved edits without overwriting an in-progress drag in the first window.

---

## File Structure

```text
package.json                         scripts and dependencies
src/main.tsx                         React entry point
src/App.tsx                          editor composition and project lifecycle
src/types/project.ts                 shared project, asset, page, and element types
src/lib/project.ts                   pure project and page mutations
src/lib/history.ts                   bounded undo/redo history operations
src/lib/archive.ts                   ZIP project import/export
src/lib/storage.ts                   IndexedDB persistence and Blob operations
src/lib/sync.ts                      BroadcastChannel change notifications
src/hooks/useProject.ts              autosave, synchronization, and editor state
src/components/EditorHeader.tsx      title, history, preview, import/export controls
src/components/PageSidebar.tsx       page creation, naming, switching, deletion
src/components/AssetLibrary.tsx      image upload and shared asset selection
src/components/Canvas.tsx            image rendering, selection, and transforms
src/components/LayersPanel.tsx       visibility, locking, deletion, and layer ordering
src/components/PreviewModal.tsx      edit-free page preview
src/styles.css                       responsive canvas-first visual system
src/**/*.test.ts                     unit tests for pure and storage modules
```

### Task 1: Application foundation and document model

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/types/project.ts`, `src/lib/project.ts`
- Test: `src/lib/project.test.ts`

**Interfaces:**
- Produces: `createProject(): Project`, `createPage(name: string): Page`, `addAssetElement(page, assetId): Page`, `removeElement(page, elementId): Page`.

- [ ] Write tests for a default project, independent page element arrays, and removal of an element without removal of its asset metadata.
- [ ] Run `npm test -- project` and confirm the missing module/test failure.
- [ ] Create the Vite React TypeScript application and implement the `Project`, `Page`, `Asset`, and `CanvasElement` types plus the pure mutation helpers.
- [ ] Run `npm test -- project` and confirm passing document-model tests.
- [ ] Commit with `feat: add layout editor document model`.

### Task 2: Local persistence, cross-window updates, and history

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/sync.ts`, `src/lib/history.ts`, `src/hooks/useProject.ts`
- Test: `src/lib/storage.test.ts`, `src/lib/history.test.ts`

**Interfaces:**
- Consumes: `Project`, `Page` from `src/types/project.ts`.
- Produces: `loadProject(): Promise<Project | null>`, `saveProject(project: Project): Promise<void>`, `saveAssetBlob(assetId: string, blob: Blob): Promise<void>`, `createHistory(page: Page): HistoryState`, and `useProject()`.

- [ ] Write storage tests for project metadata and Blob round-trip with fake-indexeddb; write history tests for 50-entry retention, undo, and redo.
- [ ] Run `npm test -- storage history` and confirm the missing implementation failure.
- [ ] Implement IndexedDB stores, debounced autosave, BroadcastChannel version messages, and bounded per-page history.
- [ ] Run `npm test -- storage history` and confirm passing tests.
- [ ] Commit with `feat: persist editor projects locally`.

### Task 3: Page and asset-library workflows

**Files:**
- Create: `src/components/PageSidebar.tsx`, `src/components/AssetLibrary.tsx`
- Modify: `src/App.tsx`, `src/hooks/useProject.ts`, `src/styles.css`
- Test: `src/components/PageSidebar.test.tsx`, `src/components/AssetLibrary.test.tsx`

**Interfaces:**
- Consumes: `useProject()` project mutation callbacks.
- Produces: `onCreatePage()`, `onRenamePage(pageId, name)`, `onSelectPage(pageId)`, `onUploadAssets(files)`, `onAddAsset(assetId)` event callbacks.

- [ ] Write component tests for immediate page naming, page switch isolation, image-file-only uploads, and adding an asset reference to the active page.
- [ ] Run the focused component tests and confirm failure before the components exist.
- [ ] Implement responsive page and asset panels; validate image decoding before storing each Blob and show an actionable error for unsupported files.
- [ ] Run the focused component tests and confirm passing behavior.
- [ ] Commit with `feat: add pages and shared asset library`.

### Task 4: Canvas transforms and layer management

**Files:**
- Create: `src/components/Canvas.tsx`, `src/components/LayersPanel.tsx`
- Modify: `src/lib/project.ts`, `src/App.tsx`, `src/styles.css`
- Test: `src/lib/project.test.ts`, `src/components/LayersPanel.test.tsx`

**Interfaces:**
- Consumes: `CanvasElement` and visible asset object URLs.
- Produces: `updateElementTransform(pageId, elementId, patch)`, `toggleElementVisible(elementId)`, `toggleElementLocked(elementId)`, and `reorderElements(activeId, overId)`.

- [ ] Add tests for transform updates, layer reordering, hidden-element exclusion, locked-element immutability, and element deletion preserving assets.
- [ ] Run the focused tests and confirm they fail for the new mutations/components.
- [ ] Render elements with react-moveable for drag, resize, and rotate; add dnd-kit layer reordering with visibility, lock, and delete controls.
- [ ] Run the focused tests and confirm all canvas and layer cases pass.
- [ ] Commit with `feat: add canvas transforms and layer controls`.

### Task 5: Preview and portable project archives

**Files:**
- Create: `src/lib/archive.ts`, `src/components/PreviewModal.tsx`
- Modify: `src/components/EditorHeader.tsx`, `src/App.tsx`, `src/styles.css`
- Test: `src/lib/archive.test.ts`

**Interfaces:**
- Consumes: `Project` plus asset Blob read/write functions.
- Produces: `exportProject(project): Promise<Blob>`, `importProject(file): Promise<ImportedProject>`, `PreviewModal({ page, assets, onClose })`.

- [ ] Write archive tests for a project/transparent image Blob round trip and rejection of an invalid ZIP without altering a loaded project.
- [ ] Run `npm test -- archive` and confirm failure before implementation.
- [ ] Implement JSZip project export/import, header controls, and a full-screen preview that has no edit chrome or selection controls.
- [ ] Run `npm test -- archive` and confirm archive tests pass.
- [ ] Commit with `feat: add preview and project archive support`.

### Task 6: Integration verification and startup guidance

**Files:**
- Create: `README.md`
- Modify: `src/App.tsx`, `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: all editor components and `useProject()`.
- Produces: complete editor shell with an initial “首页” canvas and visible save/error status.

- [ ] Write an integration test that starts an empty project, uploads an image, adds it to one page, creates another page, and confirms asset reuse with independent layouts.
- [ ] Run `npm test -- App` and confirm failure before final composition.
- [ ] Compose the editor shell; add concise README install, development, build, preview, backup, and same-browser multi-window instructions.
- [ ] Run `npm test`, `npm run build`, and a local smoke check of the built application; confirm all commands pass.
- [ ] Commit with `docs: add editor startup guide`.
