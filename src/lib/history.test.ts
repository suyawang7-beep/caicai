import { describe, expect, it } from 'vitest';
import { createHistory, pushHistory, redo, undo } from './history';
import { createPage } from './project';

describe('history', () => {
  it('undoes and redoes page snapshots', () => {
    const initial = createPage('首页');
    const changed = { ...initial, name: '已修改' };
    const history = pushHistory(createHistory(initial), changed);
    expect(undo(history).present.name).toBe('首页');
    expect(redo(undo(history)).present.name).toBe('已修改');
  });

  it('keeps at most fifty prior snapshots', () => {
    let history = createHistory(createPage('首页'));
    for (let index = 0; index < 60; index++) history = pushHistory(history, { ...history.present, name: String(index) });
    expect(history.past).toHaveLength(50);
  });
});
