import { LEVELS, levelIndex, WORLDS } from './data/levels';
import { STRINGS } from './data/strings';
import { mountLevel } from './ui/levelScreen';
import { isUnlocked, mountMap } from './ui/mapScreen';
import { loadProgress, recordStars, saveProgress, type Progress } from './ui/storage';
import './ui/style.css';

const root = document.getElementById('app')!;
let progress: Progress = loadProgress();
let unmount: (() => void) | null = null;

/** Routes: "#/" is the map, "#/level/1-3" is a level. */
function route(): void {
  unmount?.();
  unmount = null;
  const match = /^#\/level\/(.+)$/.exec(window.location.hash);
  const index = match ? levelIndex(decodeURIComponent(match[1])) : -1;

  if (index < 0 || !isUnlocked(progress, index)) {
    document.title = STRINGS.gameTitle;
    unmount = mountMap({
      root,
      progress,
      onPlay: (id) => (window.location.hash = `#/level/${encodeURIComponent(id)}`),
      onReset: () => {
        progress = {};
        saveProgress(progress);
        route();
      },
    });
    return;
  }

  const level = LEVELS[index];
  const world = WORLDS.find((w) => w.id === level.world);
  document.title = `${STRINGS.level(level.id)} · ${STRINGS.gameTitle}`;
  unmount = mountLevel({
    root,
    level,
    worldTitle: world ? STRINGS.world(world.id, world.title) : '',
    hasNext: index + 1 < LEVELS.length,
    onBack: () => (window.location.hash = '#/'),
    onNext: () => (window.location.hash = `#/level/${encodeURIComponent(LEVELS[index + 1].id)}`),
    onSolved: (stars) => {
      progress = recordStars(progress, level.id, stars);
    },
  });
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
