import { sliceColumns, sliceRows } from './grid';
import { cloneState } from './state';
import type { GameState, Orientation, Piece, Sentence } from './types';

/** The number sentence for splitting an h × w block at offset `at`. */
export function cutSentence(h: number, w: number, orientation: Orientation, at: number): Sentence {
  if (orientation === 'vertical') {
    return {
      factors: `${h} × ${w} = ${h} × ${at} + ${h} × ${w - at}`,
      totals: `${h * w} = ${h * at} + ${h * (w - at)}`,
    };
  }
  return {
    factors: `${h} × ${w} = ${at} × ${w} + ${h - at} × ${w}`,
    totals: `${h * w} = ${at * w} + ${(h - at) * w}`,
  };
}

/**
 * Splits one piece `at` cells from its left edge (vertical) or top edge (horizontal).
 * The two halves keep their place, so they still sit side by side.
 */
export function splitPiece(
  piece: Piece,
  orientation: Orientation,
  at: number,
  ids: [number, number],
): [Piece, Piece] {
  if (orientation === 'vertical') {
    if (at <= 0 || at >= piece.w) throw new RangeError(`cannot cut a ${piece.w}-wide piece at ${at}`);
    return [
      { ...piece, id: ids[0], w: at, toppings: sliceColumns(piece.toppings, 0, at) },
      { ...piece, id: ids[1], w: piece.w - at, x: piece.x + at, toppings: sliceColumns(piece.toppings, at, piece.w) },
    ];
  }
  if (at <= 0 || at >= piece.h) throw new RangeError(`cannot cut a ${piece.h}-tall piece at ${at}`);
  return [
    { ...piece, id: ids[0], h: at, toppings: sliceRows(piece.toppings, 0, at) },
    { ...piece, id: ids[1], h: piece.h - at, y: piece.y + at, toppings: sliceRows(piece.toppings, at, piece.h) },
  ];
}

/** Board pieces that a knife stroke along board grid line `line` passes through. */
export function piecesCrossed(state: GameState, orientation: Orientation, line: number): Piece[] {
  return state.pieces.filter((p) => {
    if (p.area !== 'board') return false;
    return orientation === 'vertical' ? p.x < line && line < p.x + p.w : p.y < line && line < p.y + p.h;
  });
}

export interface StrokeResult {
  state: GameState;
  sentences: Sentence[];
}

/**
 * One knife stroke along a full board grid line. It cuts every board piece it passes
 * through and counts as one cut. Returns null when the line crosses no piece.
 */
export function applyStroke(state: GameState, orientation: Orientation, line: number): StrokeResult | null {
  const crossed = piecesCrossed(state, orientation, line);
  if (crossed.length === 0) return null;
  const next = cloneState(state);
  const sentences: Sentence[] = [];
  for (const piece of crossed) {
    const at = orientation === 'vertical' ? line - piece.x : line - piece.y;
    const halves = splitPiece(piece, orientation, at, [next.nextId, next.nextId + 1]);
    next.nextId += 2;
    const index = next.pieces.findIndex((p) => p.id === piece.id);
    next.pieces.splice(index, 1, ...halves);
    sentences.push(cutSentence(piece.h, piece.w, orientation, at));
  }
  next.cuts += 1;
  return { state: next, sentences };
}
