/**
 * Level checker. Finds the fewest knife strokes that let the pieces fill the box.
 *
 * Model: players can slide pieces anywhere on the board before a stroke, so one
 * stroke can cut any set of pieces, each at its own offset, as long as all cuts in
 * the stroke run the same way. When turning is allowed, a piece can be turned
 * first, so a stroke can then cut pieces either way.
 */
import { rotateClockwise, sliceColumns, sliceRows, toppingAt } from './grid';
import { compartmentToppings } from './state';
import type { LevelDef, ToppingGrid } from './types';

export interface SolverPiece {
  w: number;
  h: number;
  t: ToppingGrid;
}

const pieceKey = (p: SolverPiece): string => `${p.h}x${p.w}:${p.t.join('/')}`;
const stateKey = (ps: SolverPiece[]): string => ps.map(pieceKey).sort().join('|');

function orientations(p: SolverPiece, rotation: boolean): SolverPiece[] {
  if (!rotation) return [p];
  const out: SolverPiece[] = [];
  const seen = new Set<string>();
  let cur = p;
  for (let i = 0; i < 4; i++) {
    const k = pieceKey(cur);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(cur);
    }
    cur = { w: cur.h, h: cur.w, t: rotateClockwise(cur.t) };
  }
  return out;
}

/** Whether these pieces, uncut, exactly fill every compartment with toppings matching. */
export function canPack(level: LevelDef, pieces: SolverPiece[]): boolean {
  const boxArea = level.compartments.reduce((s, c) => s + c.w * c.h, 0);
  if (pieces.reduce((s, p) => s + p.w * p.h, 0) !== boxArea) return false;

  const comps = level.compartments.map((c) => ({
    c,
    need: compartmentToppings(c),
    filled: Array.from({ length: c.h }, () => new Array<boolean>(c.w).fill(false)),
  }));
  const options = pieces.map((p) => orientations(p, level.rules.rotation));
  const used = new Array<boolean>(pieces.length).fill(false);

  const firstEmpty = (): { ci: number; r: number; c: number } | null => {
    for (let ci = 0; ci < comps.length; ci++) {
      const { filled } = comps[ci];
      for (let r = 0; r < filled.length; r++) {
        for (let c = 0; c < filled[r].length; c++) if (!filled[r][c]) return { ci, r, c };
      }
    }
    return null;
  };

  const solve = (): boolean => {
    const spot = firstEmpty();
    if (!spot) return true;
    const comp = comps[spot.ci];
    const tried = new Set<string>();
    for (let j = 0; j < pieces.length; j++) {
      if (used[j]) continue;
      const k = pieceKey(pieces[j]);
      if (tried.has(k)) continue;
      tried.add(k);
      for (const o of options[j]) {
        if (spot.c + o.w > comp.c.w || spot.r + o.h > comp.c.h) continue;
        let fits = true;
        for (let r = 0; r < o.h && fits; r++) {
          for (let c = 0; c < o.w; c++) {
            const rr = spot.r + r;
            const cc = spot.c + c;
            if (comp.filled[rr][cc] || toppingAt(o.t, c, r) !== toppingAt(comp.need, cc, rr)) {
              fits = false;
              break;
            }
          }
        }
        if (!fits) continue;
        for (let r = 0; r < o.h; r++) for (let c = 0; c < o.w; c++) comp.filled[spot.r + r][spot.c + c] = true;
        used[j] = true;
        if (solve()) return true;
        used[j] = false;
        for (let r = 0; r < o.h; r++) for (let c = 0; c < o.w; c++) comp.filled[spot.r + r][spot.c + c] = false;
      }
    }
    return false;
  };

  return solve();
}

type CutOption = null | { dir: 'v' | 'h'; at: number };

function cutOptions(p: SolverPiece, dirs: Array<'v' | 'h'>): CutOption[] {
  const out: CutOption[] = [null];
  if (dirs.includes('v')) for (let at = 1; at < p.w; at++) out.push({ dir: 'v', at });
  if (dirs.includes('h')) for (let at = 1; at < p.h; at++) out.push({ dir: 'h', at });
  return out;
}

function applyOption(p: SolverPiece, o: Exclude<CutOption, null>): SolverPiece[] {
  if (o.dir === 'v') {
    return [
      { w: o.at, h: p.h, t: sliceColumns(p.t, 0, o.at) },
      { w: p.w - o.at, h: p.h, t: sliceColumns(p.t, o.at, p.w) },
    ];
  }
  return [
    { w: p.w, h: o.at, t: sliceRows(p.t, 0, o.at) },
    { w: p.w, h: p.h - o.at, t: sliceRows(p.t, o.at, p.h) },
  ];
}

/** Every state one knife stroke away. */
function strokesFrom(pieces: SolverPiece[], rotation: boolean): SolverPiece[][] {
  const passes: Array<Array<'v' | 'h'>> = rotation ? [['v', 'h']] : [['v'], ['h']];
  const results: SolverPiece[][] = [];
  for (const dirs of passes) {
    const opts = pieces.map((p) => cutOptions(p, dirs));
    const pick: CutOption[] = [];
    const walk = (i: number): void => {
      if (i === pieces.length) {
        if (pick.every((o) => o === null)) return;
        const next: SolverPiece[] = [];
        pieces.forEach((p, k) => {
          const o = pick[k];
          if (o === null) next.push(p);
          else next.push(...applyOption(p, o));
        });
        results.push(next);
        return;
      }
      for (const o of opts[i]) {
        pick.push(o);
        walk(i + 1);
        pick.pop();
      }
    };
    walk(0);
  }
  return results;
}

/** The fewest knife strokes that solve the level, or null if none up to `maxCuts` does. */
export function minCuts(level: LevelDef, maxCuts = 4): number | null {
  const start: SolverPiece[] = level.ingredients.map((i) => ({
    w: i.w,
    h: i.h,
    t: i.toppings ?? Array.from({ length: i.h }, () => '.'.repeat(i.w)),
  }));
  let frontier = new Map<string, SolverPiece[]>([[stateKey(start), start]]);
  const seen = new Set(frontier.keys());
  for (let depth = 0; depth <= maxCuts; depth++) {
    for (const ps of frontier.values()) if (canPack(level, ps)) return depth;
    if (depth === maxCuts) break;
    const next = new Map<string, SolverPiece[]>();
    for (const ps of frontier.values()) {
      for (const n of strokesFrom(ps, level.rules.rotation)) {
        const k = stateKey(n);
        if (seen.has(k)) continue;
        seen.add(k);
        next.set(k, n);
      }
    }
    frontier = next;
  }
  return null;
}
