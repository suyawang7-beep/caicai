import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../types/project';
import { createProject } from '../lib/project';
import { loadProject, saveProject } from '../lib/storage';
import { announceProjectUpdate, listenForProjectUpdates } from '../lib/sync';

export function useProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const undoStack = useRef<Project[]>([]); const redoStack = useRef<Project[]>([]); const remote = useRef(false); const editing = useRef(false); const pending = useRef<Project | null>(null);
  useEffect(() => { loadProject().then((saved) => setProject(saved ?? createProject())).catch(() => { setError('无法读取本地项目。'); setProject(createProject()); }); return listenForProjectUpdates(() => loadProject().then((next) => { if (!next) return; if (editing.current) { pending.current = next; return; } remote.current = true; setProject(next); })); }, []);
  useEffect(() => { if (!project) return; if (remote.current) { remote.current = false; return; } const timer = window.setTimeout(() => { saveProject(project).then(announceProjectUpdate).catch(() => setError('自动保存失败，请导出备份。')); }, 300); return () => clearTimeout(timer); }, [project]);
  const update = useCallback((fn: (current: Project) => Project) => setProject((current) => { if (!current) return current; undoStack.current = [...undoStack.current, structuredClone(current)].slice(-50); redoStack.current = []; return { ...fn(current), updatedAt: Date.now() }; }), []);
  const undo = useCallback(() => setProject((current) => { const previous = undoStack.current.pop(); if (!current || !previous) return current; redoStack.current.push(structuredClone(current)); return previous; }), []);
  const redo = useCallback(() => setProject((current) => { const next = redoStack.current.pop(); if (!current || !next) return current; undoStack.current.push(structuredClone(current)); return next; }), []);
  const setEditing = (value: boolean) => { editing.current = value; if (!value && pending.current) { remote.current = true; setProject(pending.current); pending.current = null; } };
  return { project, update, error, setError, undo, redo, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0, setEditing, replaceProject: (next: Project) => { undoStack.current = []; redoStack.current = []; setProject(next); } };
}
