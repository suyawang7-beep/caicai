import type { Page } from '../types/project';

export type HistoryState = { past: Page[]; present: Page; future: Page[] };
const clone = (page: Page) => structuredClone(page);
export const createHistory = (page: Page): HistoryState => ({ past: [], present: clone(page), future: [] });
export const pushHistory = (history: HistoryState, page: Page): HistoryState => ({ past: [...history.past, clone(history.present)].slice(-50), present: clone(page), future: [] });
export const undo = (history: HistoryState): HistoryState => {
  const previous = history.past.at(-1);
  return previous ? { past: history.past.slice(0, -1), present: clone(previous), future: [clone(history.present), ...history.future] } : history;
};
export const redo = (history: HistoryState): HistoryState => {
  const next = history.future[0];
  return next ? { past: [...history.past, clone(history.present)].slice(-50), present: clone(next), future: history.future.slice(1) } : history;
};
