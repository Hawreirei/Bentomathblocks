import { plainGrid } from './grid';
import type { CompartmentDef, GameState, LevelDef, Piece, ToppingGrid } from './types';

export function compartmentToppings(c: CompartmentDef): ToppingGrid {
  return c.toppings ?? plainGrid(c.w, c.h);
}

/** The starting state of a level: every ingredient whole, on the cutting board. */
export function initialState(level: LevelDef): GameState {
  const pieces: Piece[] = level.ingredients.map((ing, i) => ({
    id: i + 1,
    kind: ing.kind,
    w: ing.w,
    h: ing.h,
    toppings: ing.toppings ?? plainGrid(ing.w, ing.h),
    area: 'board',
    x: ing.x,
    y: ing.y,
  }));
  return { pieces, cuts: 0, nextId: pieces.length + 1 };
}

export function cloneState(state: GameState): GameState {
  return {
    cuts: state.cuts,
    nextId: state.nextId,
    pieces: state.pieces.map((p) => ({ ...p, toppings: [...p.toppings] })),
  };
}

export function findPiece(state: GameState, id: number): Piece | undefined {
  return state.pieces.find((p) => p.id === id);
}
