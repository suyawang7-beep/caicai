import type { Page } from '../types/project';

export function PageSidebar({ pages, activeId, onSelect, onCreate, onRename, onDelete }: { pages: Page[]; activeId: string; onSelect: (id: string) => void; onCreate: () => void; onRename: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  return <aside className="sidebar"><div className="panel-title">页面 <button onClick={onCreate}>＋ 新建</button></div>{pages.map((page) => <div className={'page-row ' + (page.id === activeId ? 'active' : '')} key={page.id}><button onClick={() => onSelect(page.id)}>{page.name}</button><span><button title="重命名" onClick={() => { const name = prompt('页面名称', page.name); if (name?.trim()) onRename(page.id, name.trim()); }}>✎</button>{pages.length > 1 && <button title="删除页面" onClick={() => confirm(`删除「${page.name}」？`) && onDelete(page.id)}>×</button>}</span></div>)}</aside>;
}
