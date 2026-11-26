import world1 from '../../levels/world1.json';
import world2 from '../../levels/world2.json';
import type { LevelDef } from '../core/types';

export interface WorldInfo {
  id: number;
  title: string;
  subtitle: string;
}

export const WORLDS: WorldInfo[] = [
  { id: 1, title: 'Arrays', subtitle: 'Count the cells. Rows × columns = area.' },
  { id: 2, title: 'Split & Add', subtitle: 'One cut, two parts: 4 × 5 = 4 × 3 + 4 × 2.' },
];

/** Every level in play order. */
export const LEVELS: LevelDef[] = [...world1, ...world2] as LevelDef[];

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}
