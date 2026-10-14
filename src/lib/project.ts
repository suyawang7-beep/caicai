import type { CanvasElement, Page, Project } from '../types/project';

const id = () => crypto.randomUUID();

export const createPage = (name: string): Page => ({ id: id(), name, width: 1080, height: 1350, elements: [] });

export const createProject = (): Project => {
  const page = createPage('首页');
  return { id: id(), name: '未命名项目', activePageId: page.id, pages: [page], assets: [], updatedAt: Date.now() };
};

export const addAssetElement = (page: Page, assetId: string): Page => {
  const element: CanvasElement = { id: id(), assetId, x: page.width / 2, y: page.height / 2, scale: 1, rotation: 0, visible: true, locked: false };
  return { ...page, elements: [...page.elements, element] };
};

export const removeElement = (page: Page, elementId: string): Page => ({ ...page, elements: page.elements.filter((element) => element.id !== elementId) });

export const updateElementTransform = (page: Page, elementId: string, patch: Partial<Pick<CanvasElement, 'x' | 'y' | 'scale' | 'rotation'>>): Page => ({
  ...page, elements: page.elements.map((element) => element.id === elementId && !element.locked ? { ...element, ...patch } : element),
});
export const toggleElementVisible = (page: Page, elementId: string): Page => ({ ...page, elements: page.elements.map((element) => element.id === elementId ? { ...element, visible: !element.visible } : element) });
export const toggleElementLocked = (page: Page, elementId: string): Page => ({ ...page, elements: page.elements.map((element) => element.id === elementId ? { ...element, locked: !element.locked } : element) });
export const reorderElements = (page: Page, activeId: string, overId: string): Page => {
  const from = page.elements.findIndex((element) => element.id === activeId); const to = page.elements.findIndex((element) => element.id === overId);
  if (from < 0 || to < 0) return page;
  const elements = [...page.elements]; const [active] = elements.splice(from, 1); elements.splice(to, 0, active);
  return { ...page, elements };
};
