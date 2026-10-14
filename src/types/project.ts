export type Asset = { id: string; name: string; type: string; width: number; height: number };
export type CanvasElement = { id: string; assetId: string; x: number; y: number; scale: number; rotation: number; visible: boolean; locked: boolean };
export type Page = { id: string; name: string; width: number; height: number; elements: CanvasElement[] };
export type Project = { id: string; name: string; activePageId: string; pages: Page[]; assets: Asset[]; updatedAt: number };
