/**
 * Plays a level's written solution through the real game rules: the real board size,
 * strokes that cut every board piece they cross, and the box placement checks.
 * The level checker uses it to prove every level can be finished at par.
 */
import { applyStroke } from './cut';
import { canPlaceOnBoard, checkBoxPlacement } from './place';
import { isSolved } from './rules';
import { initialState } from './state';
import type { GameState, LevelDef, Piece, SolutionStep } from './types';

export type ReplayResult =
  | { ok: true; state: GameState }
  | { ok: false; step: number; reason: string; state: GameState };

function boardPieceAt(state: GameState, [x, y]: [number, number]): Piece | undefined {
  return state.pieces.find((p) => p.area === 'board' && p.x === x && p.y === y);
}

export function replaySolution(level: LevelDef, steps: SolutionStep[]): ReplayResult {
  let state = initialState(level);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const fail = (reason: string): ReplayResult => ({ ok: false, step: i + 1, reason, state });

    if ('cut' in step) {
      const result = applyStroke(state, step.cut, step.line);
      if (!result) return fail(`${step.cut} stroke at line ${step.line} misses every piece`);
      state = result.state;
      continue;
    }

    const from = 'slide' in step ? step.slide : step.pack;
    const piece = boardPieceAt(state, from);
    if (!piece) return fail(`no board piece with its top-left at (${from.join(', ')})`);
    const [x, y] = step.to;

    if ('slide' in step) {
      if (!canPlaceOnBoard(level, state, piece, x, y)) return fail(`cannot slide the piece to board (${x}, ${y})`);
      state = { ...state, pieces: state.pieces.map((p) => (p.id === piece.id ? { ...p, x, y } : p)) };
      continue;
    }

    const check = checkBoxPlacement(level, state, piece, x, y);
    if (!check.ok) return fail(`cannot pack the piece at box (${x}, ${y}): ${check.reason}`);
    state = { ...state, pieces: state.pieces.map((p) => (p.id === piece.id ? { ...p, area: 'box' as const, x, y } : p)) };
  }
  if (!isSolved(level, state)) return { ok: false, step: steps.length, reason: 'the box is not full at the end', state };
  return { ok: true, state };
}
