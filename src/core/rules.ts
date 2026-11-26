import { filledCells } from './place';
import type { CompartmentDef, GameState, LevelDef } from './types';

/** Solved when every compartment is full. Placement rules already guarantee toppings match. */
export function isSolved(level: LevelDef, state: GameState): boolean {
  return level.compartments.every((c) => filledCells(state, c) === c.w * c.h);
}

/** 3 stars at par or better, 2 at par + 1, otherwise 1. */
export function starsFor(cuts: number, par: number): 1 | 2 | 3 {
  if (cuts <= par) return 3;
  if (cuts === par + 1) return 2;
  return 1;
}

/** The text on a compartment's label, before and after it is full. */
export function labelText(comp: CompartmentDef, full: boolean): string {
  const area = comp.w * comp.h;
  switch (comp.label) {
    case 'count':
      return String(area);
    case 'product':
      return `${comp.h} × ${comp.w}`;
    case 'missing':
      return full ? `${comp.h} × ${comp.w} = ${area}` : `${comp.h} × ? = ${area}`;
  }
}
