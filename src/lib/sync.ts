const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('layout-editor');
export const announceProjectUpdate = () => channel?.postMessage({ type: 'project-updated' });
export const listenForProjectUpdates = (listener: () => void) => { if (!channel) return () => {}; const handler = () => listener(); channel.addEventListener('message', handler); return () => channel.removeEventListener('message', handler); };
