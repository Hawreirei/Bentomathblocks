/** Best stars per level id, kept in the browser. Storage can be missing or blocked, so every access is guarded. */
const KEY = 'bento-math-blocks:progress:v1';

export type Progress = Record<string, number>;

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') return parsed as Progress;
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return {};
}

export function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable: progress lasts for this visit only.
  }
}

export function recordStars(progress: Progress, levelId: string, stars: number): Progress {
  const next = { ...progress, [levelId]: Math.max(progress[levelId] ?? 0, stars) };
  saveProgress(next);
  return next;
}
