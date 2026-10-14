import type { Project } from '../types/project';

const DB = 'layout-editor'; const VERSION = 1;
const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB, VERSION);
  request.onupgradeneeded = () => { request.result.createObjectStore('projects'); request.result.createObjectStore('blobs'); };
  request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
});
const put = async (store: string, key: string, value: unknown) => { const db = await open(); await new Promise<void>((resolve, reject) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(value, key); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close(); };
const get = async <T>(store: string, key: string) => { const db = await open(); const value = await new Promise<T | undefined>((resolve, reject) => { const request = db.transaction(store).objectStore(store).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); db.close(); return value; };
export const saveProject = (project: Project) => put('projects', 'current', project);
export const loadProject = () => get<Project>('projects', 'current');
export const saveAssetBlob = (id: string, blob: Blob) => put('blobs', id, blob);
export const loadAssetBlob = (id: string) => get<Blob>('blobs', id);
export const clearStorage = async () => { const db = await open(); await new Promise<void>((resolve, reject) => { const tx = db.transaction(['projects', 'blobs'], 'readwrite'); tx.objectStore('projects').clear(); tx.objectStore('blobs').clear(); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close(); };
