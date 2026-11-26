import { toppingAt } from './grid';
import { compartmentToppings } from './state';
import type { CompartmentDef, GameState, LevelDef, Piece } from './types';

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function contains(outer: { x: number; y: number; w: number; h: number }, inner: { x: number; y: number; w: number; h: number }): boolean {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}

/** Whether `piece`, moved to (x, y) on the board, stays on the board and clear of other board pieces. */
export function canPlaceOnBoard(level: LevelDef, state: GameState, piece: Piece, x: number, y: number): boolean {
  const rect = { x, y, w: piece.w, h: piece.h };
  if (!contains({ x: 0, y: 0, ...level.board }, rect)) return false;
  return !state.pieces.some((p) => p.id !== piece.id && p.area === 'board' && overlaps(p, rect));
}

export type BoxPlacement =
  | { ok: true; compartment: number }
  | { ok: false; reason: 'outside' | 'overlap' | 'topping'; cell?: { x: number; y: number } };

/**
 * Whether `piece` can sit with its top-left at box cell (x, y): wholly inside one
 * compartment, clear of other box pieces, and with every topping on its matching outline.
 */
export function checkBoxPlacement(level: LevelDef, state: GameState, piece: Piece, x: number, y: number): BoxPlacement {
  const rect = { x, y, w: piece.w, h: piece.h };
  const index = level.compartments.findIndex((c) => contains(c, rect));
  if (index < 0) return { ok: false, reason: 'outside' };
  if (state.pieces.some((p) => p.id !== piece.id && p.area === 'box' && overlaps(p, rect))) {
    return { ok: false, reason: 'overlap' };
  }
  const comp = level.compartments[index];
  const need = compartmentToppings(comp);
  for (let r = 0; r < piece.h; r++) {
    for (let c = 0; c < piece.w; c++) {
      if (toppingAt(piece.toppings, c, r) !== toppingAt(need, x + c - comp.x, y + r - comp.y)) {
        return { ok: false, reason: 'topping', cell: { x: x + c, y: y + r } };
      }
    }
  }
  return { ok: true, compartment: index };
}

/** How many cells of a compartment are covered by pieces in the box. */
export function filledCells(state: GameState, comp: CompartmentDef): number {
  let total = 0;
  for (const p of state.pieces) {
    if (p.area === 'box' && contains(comp, p)) total += p.w * p.h;
  }
  return total;
}
