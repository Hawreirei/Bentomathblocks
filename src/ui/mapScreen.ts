import { LEVELS, WORLDS } from '../data/levels';
import { STRINGS } from '../data/strings';
import { ICONS, starSvg } from './art';
import type { Progress } from './storage';

export interface MapScreenOptions {
  root: HTMLElement;
  progress: Progress;
  onPlay(levelId: string): void;
  onReset(): void;
}

/** A level is open when it is the first one or the one before it has been solved. */
export function isUnlocked(progress: Progress, index: number): boolean {
  return index === 0 || (progress[LEVELS[index - 1].id] ?? 0) > 0;
}

const BOX_FILLS = [
  ['#FBF7EE', '#F6C945', '#5FAF5A', '#F59479'],
  ['#F6C945', '#F59479'],
  ['#F59479', '#FBF7EE', '#F6C945', '#5FAF5A'],
];

export function mountMap(opts: MapScreenOptions): () => void {
  const { root, progress } = opts;
  const total = LEVELS.length * 3;
  const got = LEVELS.reduce((s, l) => s + (progress[l.id] ?? 0), 0);

  const worlds = WORLDS.map((w, wi) => {
    const levels = LEVELS.map((l, i) => ({ l, i })).filter(({ l }) => l.world === w.id);
    const worldStars = levels.reduce((s, { l }) => s + (progress[l.id] ?? 0), 0);
    const tiles = levels
      .map(({ l, i }) => {
        if (!isUnlocked(progress, i)) {
          return `<button type="button" class="tile locked" disabled aria-label="${STRINGS.levelLocked(l.id)}">${ICONS.lock}</button>`;
        }
        const stars = progress[l.id] ?? 0;
        const current = stars === 0;
        return `<button type="button" class="tile${current ? ' current' : ''}" data-level="${l.id}" aria-label="${STRINGS.levelButton(l.id, stars)}">
          <span class="tile-id">${l.id}</span>
          <span class="tile-stars">${[1, 2, 3].map((n) => starSvg(n <= stars, 14)).join('')}</span>
        </button>`;
      })
      .join('');
    const fills = BOX_FILLS[wi % BOX_FILLS.length];
    return `<section class="world">
      <div class="world-box cols-${fills.length === 4 ? 2 : 'split'}" aria-hidden="true">${fills.map((f) => `<div style="background:${f}"></div>`).join('')}</div>
      <div class="world-body">
        <div class="world-head">
          <div>
            <h2>${STRINGS.world(w.id, w.title)}</h2>
            <p class="muted">${w.subtitle}</p>
          </div>
          <span class="muted strong">${STRINGS.starsOf(worldStars, levels.length * 3)}</span>
        </div>
        <div class="tiles">${tiles}</div>
      </div>
    </section>`;
  }).join('');

  root.innerHTML = `
    <div class="screen map-screen">
      <header class="map-head">
        <div class="brand">
          <div class="logo" aria-hidden="true"><div></div><div></div><div></div><div></div></div>
          <div>
            <h1>${STRINGS.gameTitle}</h1>
            <p class="muted strong">${STRINGS.tagline}</p>
          </div>
        </div>
        <span class="pill big" role="img" aria-label="${got} of ${total} stars">${starSvg(true, 26)} ${STRINGS.starsOf(got, total)}</span>
      </header>
      <h2 class="map-title">${STRINGS.mapTitle}</h2>
      <p class="muted">${STRINGS.mapSubtitle}</p>
      <div class="worlds">${worlds}</div>
      <footer class="map-foot"><button type="button" class="link-btn" data-action="reset">${STRINGS.resetProgress}</button></footer>
    </div>`;

  function onClick(e: MouseEvent): void {
    const el = e.target as HTMLElement;
    const tile = el.closest<HTMLElement>('[data-level]');
    if (tile?.dataset.level) {
      opts.onPlay(tile.dataset.level);
      return;
    }
    if (el.closest('[data-action="reset"]') && window.confirm(STRINGS.resetConfirm)) opts.onReset();
  }

  root.addEventListener('click', onClick);
  root.querySelector<HTMLElement>('.tile.current')?.focus({ preventScroll: true });
  return () => root.removeEventListener('click', onClick);
}
