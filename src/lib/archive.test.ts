import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { exportProject, importProject } from './archive';
import { createProject } from './project';

describe('project archive', () => {
  it('round-trips a project and transparent image blob', async () => {
    const project = createProject();
    const archive = await exportProject(project, new Map([['asset-1', new Blob(['image'], { type: 'image/png' })]]));
    const restored = await importProject(archive);
    expect(restored.project.pages[0].name).toBe('首页');
  });

  it('rejects an invalid archive', async () => {
    await expect(importProject(new Blob(['bad']))).rejects.toThrow('无效');
  });
});
