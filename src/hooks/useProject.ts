import { useCallback, useEffect, useState } from 'react';
import type { Project } from '../types/project';
import { createProject } from '../lib/project';
import { loadProject, saveProject } from '../lib/storage';
import { announceProjectUpdate, listenForProjectUpdates } from '../lib/sync';

export function useProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadProject().then((saved) => setProject(saved ?? createProject())).catch(() => { setError('无法读取本地项目。'); setProject(createProject()); }); return listenForProjectUpdates(() => loadProject().then((next) => next && setProject(next))); }, []);
  useEffect(() => { if (!project) return; const timer = window.setTimeout(() => { saveProject(project).then(announceProjectUpdate).catch(() => setError('自动保存失败，请导出备份。')); }, 300); return () => clearTimeout(timer); }, [project]);
  const update = useCallback((fn: (current: Project) => Project) => setProject((current) => current && { ...fn(current), updatedAt: Date.now() }), []);
  return { project, update, error, setError };
}
