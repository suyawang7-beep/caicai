import { useEffect, useMemo, useRef, useState } from 'react';
import { AssetLibrary } from './components/AssetLibrary';
import { Canvas } from './components/Canvas';
import { LayersPanel } from './components/LayersPanel';
import { PageSidebar } from './components/PageSidebar';
import { EditorHeader } from './components/EditorHeader';
import { PreviewModal } from './components/PreviewModal';
import { useProject } from './hooks/useProject';
import { exportProject, importProject } from './lib/archive';
import { addAssetElement, createPage, removeElement, reorderElements, toggleElementLocked, toggleElementVisible, updateElementTransform } from './lib/project';
import { loadAssetBlob, saveAssetBlob } from './lib/storage';
import type { Asset, CanvasElement, Page, Project } from './types/project';

const changePage = (project: Project, pageId: string, change: (page: Page) => Page): Project => ({ ...project, pages: project.pages.map((page) => page.id === pageId ? change(page) : page) });
function LayoutEditor() {
  const { project, update, error, undo, redo, canUndo, canRedo, replaceProject } = useProject(); const [selectedId, setSelectedId] = useState<string | null>(null); const [urls, setUrls] = useState<Record<string, string>>({}); const [preview, setPreview] = useState(false);
  useEffect(() => { if (!project) return; let active = true; Promise.all(project.assets.map(async (asset) => [asset.id, await loadAssetBlob(asset.id)] as const)).then((items) => { if (active) setUrls(Object.fromEntries(items.filter((item): item is [string, Blob] => Boolean(item[1])).map(([id, blob]) => [id, URL.createObjectURL(blob)]))); }); return () => { active = false; }; }, [project?.assets]);
  const page = useMemo(() => project?.pages.find((item) => item.id === project.activePageId), [project]);
  if (!project || !page) return <main className="loading">正在载入排版编辑器…</main>;
  const updateCurrent = (change: (page: Page) => Page) => update((current) => changePage(current, page.id, change));
  const upload = async (files: File[]) => { for (const file of files) { if (!file.type.startsWith('image/')) continue; const url = URL.createObjectURL(file); const image = new Image(); await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('图片无法读取')); image.src = url; }); URL.revokeObjectURL(url); const asset: Asset = { id: crypto.randomUUID(), name: file.name, type: file.type, width: image.naturalWidth, height: image.naturalHeight }; await saveAssetBlob(asset.id, file); update((current) => ({ ...current, assets: [...current.assets, asset] })); } };
  const download = async () => { const blobs = new Map<string, Blob>(); for (const asset of project.assets) { const blob = await loadAssetBlob(asset.id); if (blob) blobs.set(asset.id, blob); } const blob = await exportProject(project, blobs); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${project.name}.zip`; link.click(); URL.revokeObjectURL(url); };
  const restore = async (file: File) => { try { const imported = await importProject(file); for (const [id, blob] of imported.blobs) await saveAssetBlob(id, blob); replaceProject(imported.project); } catch (cause) { alert(cause instanceof Error ? cause.message : '导入失败。'); } };
  return <div className="editor"><EditorHeader name={project.name} canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} onPreview={() => setPreview(true)} onExport={() => void download()} onImport={(file) => void restore(file)} /><div className="editor-grid"><PageSidebar pages={project.pages} activeId={page.id} onSelect={(id) => { update((current) => ({ ...current, activePageId: id })); setSelectedId(null); }} onCreate={() => update((current) => { const next = createPage('未命名页面'); const name = prompt('页面名称', next.name) || next.name; return { ...current, activePageId: next.id, pages: [...current.pages, { ...next, name }] }; })} onRename={(id, name) => update((current) => changePage(current, id, (item) => ({ ...item, name })))} onDelete={(id) => update((current) => ({ ...current, pages: current.pages.filter((item) => item.id !== id), activePageId: current.activePageId === id ? current.pages.find((item) => item.id !== id)!.id : current.activePageId }))} /><Canvas page={page} urls={urls} selectedId={selectedId} onSelect={setSelectedId} onTransform={(id, patch) => updateCurrent((item) => updateElementTransform(item, id, patch))} /><AssetLibrary assets={project.assets} urls={urls} onUpload={(files) => void upload(files).catch(() => alert('图片无法读取。'))} onAdd={(assetId) => updateCurrent((item) => addAssetElement(item, assetId))} /><LayersPanel elements={page.elements} assets={project.assets} selectedId={selectedId} onSelect={setSelectedId} onToggleVisible={(id) => updateCurrent((item) => toggleElementVisible(item, id))} onToggleLocked={(id) => updateCurrent((item) => toggleElementLocked(item, id))} onDelete={(id) => { updateCurrent((item) => removeElement(item, id)); setSelectedId(null); }} onReorder={(active, over) => updateCurrent((item) => reorderElements(item, active, over))} /></div>{preview && <PreviewModal page={page} urls={urls} onClose={() => setPreview(false)} />}{error && <div className="error">{error}</div>}</div>;
}


const activityPages = [
  { path: '/', title: '庆典码头', icon: '⚓', description: '从这里上岛，看看今天的庆典消息。' },
  { path: '/check-in', title: '签到', icon: '☀', description: '每天来岛上留个脚印，收集你的庆典回忆。' },
  { path: '/office', title: '岛民事务所', icon: '✦', description: '查看庆典任务，准备领取你的上岛奖励。' },
  { path: '/post-office', title: '肥啾邮局', icon: '✉', description: '让肥啾捎去一封生日祝福。' },
  { path: '/collection', title: '回忆收藏室', icon: '▧', description: '收藏卡片，也收藏在不吱岛相遇的瞬间。' },
  { path: '/mailbox', title: '岛主信箱', icon: '♡', description: '菜菜和吱吱的庆典公告，都放在这里。' },
] as const;

// The home bulletin and mailbox deliberately read the same source.
const announcements = [
  { id: 'welcome', title: '欢迎来到菜菜的生日庆典', content: '这次的生日主角是菜菜，吱吱会作为共同岛主陪大家一起庆祝。庆典任务与开放安排将陆续在岛主信箱通知。' },
];
const pagePlans: Record<string, { heading: string; items: string[] }> = {
  '/check-in': { heading: '把每一天的快乐盖成一枚章', items: ['每日签到与连续签到记录', '七日签到进度与隐藏卡奖励'] },
  '/office': { heading: '今天想为庆典做点什么？', items: ['任务清单与完成代码核验', '金币奖励与每三项任务的额外奖励'] },
  '/post-office': { heading: '一封信，一只肥啾，一点心意', items: ['生日祝福填写与提交', '祝福展示与内容管理'] },
  '/collection': { heading: '把喜欢的瞬间好好收起来', items: ['生日卡片抽取与首次 SR 及以上保障', '卡片仓库与收集进度'] },
};
const readPath = () => window.location.hash.slice(1) || '/';

function AnnouncementList() {
  return <div className="announcement-list">{announcements.map((notice) =>
    <article key={notice.id} data-announcement><span className="eyebrow">岛主来信</span><h3>{notice.title}</h3><p>{notice.content}</p></article>
  )}</div>;
}

function CelebrationHome() {
  return <>
    <section className="celebration-hero" aria-labelledby="home-title">
      <div><p className="eyebrow">不吱岛 · BIRTHDAY CELEBRATION</p><h1 id="home-title">菜菜岛主的<br />生日庆典</h1><p className="hero-description">海风捎来一封邀请函。<br />欢迎上岛，和菜菜、吱吱一起留下新的回忆。</p><div className="hero-actions"><a className="primary-link" href="#/office">去岛民事务所 →</a><a className="secondary-link" href="#/check-in">今日签到 ☀</a></div><span className="status-note">庆典筹备中 · 各项活动将陆续开放</span></div>
      <div className="island-postcard" aria-label="不吱岛庆典邀请卡"><span className="postcard-stamp">不吱岛<br />邀请函</span><span className="postcard-bird" aria-hidden="true">啾</span><p>给每一位上岛的你</p><strong>今天的快乐，<br />也分你一份。</strong><span className="postcard-signature">菜菜 ＆ 吱吱</span></div>
    </section>
    <section className="home-bulletin celebration-card" aria-labelledby="bulletin-title"><div className="section-heading"><h2 id="bulletin-title">岛上公告</h2><a href="#/mailbox">查看岛主信箱 →</a></div><AnnouncementList /></section>
    <section aria-labelledby="destinations-title"><div className="section-heading"><div><p className="eyebrow">YOUR ISLAND DIARY</p><h2 id="destinations-title">今天，想去哪里逛逛？</h2></div><span className="muted">把快乐写进手账里</span></div><div className="destination-grid">{activityPages.slice(1, 5).map((page, index) => <a className="destination-card" key={page.path} href={`#${page.path}`}><span className="destination-number">0{index + 1}</span><span className="destination-icon" aria-hidden="true">{page.icon}</span><h3>{page.title}</h3><p>{page.description}</p><span className="destination-arrow" aria-hidden="true">↗</span></a>)}</div></section>
  </>;
}

function ActivityPage({ path }: { path: string }) {
  const page = activityPages.find((item) => item.path === path);
  if (!page) return <section className="celebration-card activity-placeholder"><p className="eyebrow">迷路的肥啾</p><h1>这条小路还没开通</h1><p>可以先回码头，换个方向继续逛逛。</p><a className="primary-link" href="#/">返回庆典码头</a></section>;
  const plan = pagePlans[path];
  return <><div className="page-intro"><p className="eyebrow">不吱岛 · 菜菜岛主生日庆典</p><h1>{page.title}</h1><p>{page.description}</p></div>{path === '/mailbox' ? <section className="celebration-card"><h2>岛主公告</h2><AnnouncementList /></section> : <section className="celebration-card activity-placeholder"><span className="placeholder-icon" aria-hidden="true">{page.icon}</span><span className="preparing-label">筹备中</span><h2>{plan.heading}</h2><p>这里已经留好位置，以下内容将在后续接入：</p><ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul><p className="muted">当前仅开放页面导航，暂不提交信息或发放奖励。</p><a className="secondary-link" href="#/">回码头逛逛 →</a></section>}</>;
}

export default function App() {
  const [path, setPath] = useState(readPath);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorVisited, setEditorVisited] = useState(path === '/editor');
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(path);
  const isEditor = path === '/editor';
  useEffect(() => {
    const onHashChange = () => { setPath(readPath()); setMenuOpen(false); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    if (isEditor) setEditorVisited(true);
    document.title = `${isEditor ? '排版工作台' : activityPages.find((page) => page.path === path)?.title ?? '页面未找到'} · 不吱岛生日庆典`;
    if (previousPath.current !== path) { mainRef.current?.focus(); previousPath.current = path; }
  }, [path, isEditor]);
  return <div className="celebration-app">
    <a className="skip-link" href="#celebration-content" onClick={(event) => { event.preventDefault(); mainRef.current?.focus(); }}>跳到页面内容</a>
    <header className="celebration-header"><a className="island-brand" href="#/" aria-label="不吱岛，返回庆典码头"><span className="brand-mark" aria-hidden="true">啾</span><span><strong>不吱岛</strong><small>菜菜岛主生日庆典</small></span></a><button className="navigation-toggle" aria-expanded={menuOpen} aria-controls="celebration-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? '收起导航 ×' : '岛上导航 ☰'}</button><nav id="celebration-navigation" className={menuOpen ? 'celebration-nav is-open' : 'celebration-nav'} aria-label="庆典页面">{activityPages.map((page) => <a key={page.path} href={`#${page.path}`} aria-current={path === page.path ? 'page' : undefined} onClick={() => setMenuOpen(false)}><span aria-hidden="true">{page.icon}</span>{page.title}</a>)}</nav></header>
    <main id="celebration-content" ref={mainRef} tabIndex={-1} className={isEditor ? 'editor-content' : 'celebration-content'}>
      {!isEditor && (path === '/' ? <CelebrationHome /> : <ActivityPage path={path} />)}
      {/* Keep the editor mounted after first use so navigation preserves undo history and pending saves. */}
      {(isEditor || editorVisited) && <div hidden={!isEditor}><h1 className="editor-page-title">排版工作台</h1><LayoutEditor /></div>}
    </main>
    <footer className="celebration-footer"><span>不吱岛 · 菜菜 ＆ 吱吱<br /><small>一起收藏平凡日子里的小小快乐。</small></span><a href="#/editor" aria-current={isEditor ? 'page' : undefined}>排版工作台 ↗</a></footer>
  </div>;
}
