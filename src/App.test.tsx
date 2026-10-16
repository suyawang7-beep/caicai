// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => root.render(<App />)); };
const navigate = async (hash: string) => {
  await act(async () => {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};

it('opens the celebration home without waiting for editor storage', async () => {
  await render();
  expect(host.querySelector('h1')?.textContent).toContain('菜菜岛主');
  expect(host.querySelector('a[href="#/office"]')?.textContent).toBeTruthy();
  expect(host.querySelector('a[href="#/mailbox"]')?.textContent).toBeTruthy();
  expect(host.querySelector('nav')?.querySelectorAll('a')).toHaveLength(6);
});

it('supports direct links, history changes and an unknown-page fallback', async () => {
  window.history.replaceState(null, '', '#/post-office');
  await render();
  expect(host.querySelector('h1')?.textContent).toBe('肥啾邮局');
  await navigate('#/check-in');
  expect(host.querySelector('h1')?.textContent).toBe('签到');
  expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('签到');
  await navigate('#/unknown');
  expect(host.querySelector('h1')?.textContent).toBe('这条小路还没开通');
  expect(host.querySelector('main a')?.getAttribute('href')).toBe('#/');
});

it('shares announcements with the mailbox and closes the mobile menu on navigation', async () => {
  await render();
  const notice = host.querySelector('[data-announcement]')?.textContent;
  const toggle = host.querySelector<HTMLButtonElement>('[aria-controls="celebration-navigation"]')!;
  expect(toggle).not.toBeNull();
  await act(async () => toggle.click());
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  await navigate('#/mailbox');
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(host.querySelector('[data-announcement]')?.textContent).toBe(notice);
});

it('opens every activity destination from its URL', async () => {
  await render();
  for (const [path, title] of [
    ['/check-in', '签到'], ['/office', '岛民事务所'],
    ['/post-office', '肥啾邮局'], ['/collection', '回忆收藏室'], ['/mailbox', '岛主信箱'],
  ]) {
    await navigate(`#${path}`);
    expect(host.querySelector('h1')?.textContent).toBe(title);
    expect(document.title).toContain(title);
    expect(document.activeElement).toBe(host.querySelector('main'));
  }
});


it('remembers the water motion choice across navigation and remounts', async () => {
  await render();
  const toggle = host.querySelector<HTMLButtonElement>('[aria-label="水波动态"]')!;
  expect(toggle).not.toBeNull();
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  await act(async () => toggle.click());
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  expect(host.querySelector('.celebration-app')?.getAttribute('data-water-motion')).toBe('off');
  await navigate('#/office');
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  await act(async () => root.unmount());
  root = createRoot(host);
  await render();
  expect(host.querySelector('[aria-label="水波动态"]')?.getAttribute('aria-pressed')).toBe('false');
});


it('follows live reduced-motion changes without overwriting the saved choice', async () => {
  const preference = Object.assign(new EventTarget(), { matches: true });
  vi.stubGlobal('matchMedia', () => preference);
  await render();
  const toggle = host.querySelector<HTMLButtonElement>('[aria-label="水波动态"]')!;
  expect(toggle.disabled).toBe(true);
  expect(host.querySelector('.celebration-app')?.getAttribute('data-water-motion')).toBe('off');
  await act(async () => {
    preference.matches = false;
    preference.dispatchEvent(new Event('change'));
  });
  expect(toggle.disabled).toBe(false);
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(host.querySelector('.celebration-app')?.getAttribute('data-water-motion')).toBe('on');
});

it('keeps the motion switch usable when browser storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  await render();
  const toggle = host.querySelector<HTMLButtonElement>('[aria-label="水波动态"]')!;
  await act(async () => toggle.click());
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
});
