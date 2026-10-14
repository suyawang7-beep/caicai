import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearStorage, loadProject, saveAssetBlob, saveProject } from './storage';
import { createProject } from './project';

describe('storage', () => {
  beforeEach(async () => { await clearStorage(); });
  it('round-trips project metadata and image blobs', async () => {
    const project = createProject();
    await saveProject(project);
    await saveAssetBlob('asset-1', new Blob(['png'], { type: 'image/png' }));
    expect((await loadProject())?.id).toBe(project.id);
  });
});
