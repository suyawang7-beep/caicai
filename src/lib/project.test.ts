import { describe, expect, it } from 'vitest';
import { addAssetElement, createPage, createProject, removeElement, reorderElements, toggleElementLocked, toggleElementVisible, updateElementTransform } from './project';

describe('project document mutations', () => {
  it('creates an editable project with one 首页 page', () => {
    const project = createProject();
    expect(project.pages).toHaveLength(1);
    expect(project.pages[0].name).toBe('首页');
  });

  it('creates independent page element lists', () => {
    const first = createPage('第一页');
    const second = createPage('第二页');
    const updated = addAssetElement(first, 'asset-1');
    expect(updated.elements).toHaveLength(1);
    expect(second.elements).toHaveLength(0);
  });

  it('removes only the canvas reference', () => {
    const page = addAssetElement(createPage('首页'), 'asset-1');
    const updated = removeElement(page, page.elements[0].id);
    expect(updated.elements).toHaveLength(0);
  });

  it('updates transforms and preserves locked elements', () => {
    const page = addAssetElement(createPage('首页'), 'asset-1');
    const moved = updateElementTransform(page, page.elements[0].id, { x: 300, rotation: 15 });
    expect(moved.elements[0]).toMatchObject({ x: 300, rotation: 15 });
    const locked = toggleElementLocked(moved, moved.elements[0].id);
    expect(updateElementTransform(locked, locked.elements[0].id, { x: 20 }).elements[0].x).toBe(300);
  });

  it('toggles visibility and changes layer order', () => {
    let page = addAssetElement(createPage('首页'), 'a');
    page = addAssetElement(page, 'b');
    expect(toggleElementVisible(page, page.elements[0].id).elements[0].visible).toBe(false);
    expect(reorderElements(page, page.elements[1].id, page.elements[0].id).elements.map((item) => item.assetId)).toEqual(['b', 'a']);
  });
});
