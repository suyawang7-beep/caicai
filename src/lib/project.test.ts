import { describe, expect, it } from 'vitest';
import { addAssetElement, createPage, createProject, removeElement } from './project';

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
});
