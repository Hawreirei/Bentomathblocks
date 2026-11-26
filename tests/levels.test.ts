import { describe, expect, it } from 'vitest';
import { isValidGrid } from '../src/core/grid';
import { minCuts } from '../src/core/solver';
import { LEVELS } from '../src/data/levels';

const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('level files', () => {
  it('have unique ids', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
  });

  for (const level of LEVELS) {
    describe(level.id, () => {
      it('has well-formed topping grids', () => {
        for (const c of level.compartments) if (c.toppings) expect(isValidGrid(c.toppings, c.w, c.h)).toBe(true);
        for (const i of level.ingredients) if (i.toppings) expect(isValidGrid(i.toppings, i.w, i.h)).toBe(true);
      });

      it('has compartments inside the box that do not overlap', () => {
        level.compartments.forEach((c, i) => {
          expect(c.x >= 0 && c.y >= 0 && c.x + c.w <= level.box.w && c.y + c.h <= level.box.h).toBe(true);
          level.compartments.slice(i + 1).forEach((d) => expect(overlap(c, d)).toBe(false));
        });
      });

      it('starts with every ingredient on the board, apart', () => {
        level.ingredients.forEach((ing, i) => {
          expect(ing.x >= 0 && ing.y >= 0 && ing.x + ing.w <= level.board.w && ing.y + ing.h <= level.board.h).toBe(true);
          level.ingredients.slice(i + 1).forEach((o) => expect(overlap(ing, o)).toBe(false));
        });
      });

      it('has as much food as box space', () => {
        const food = level.ingredients.reduce((s, i) => s + i.w * i.h, 0);
        const space = level.compartments.reduce((s, c) => s + c.w * c.h, 0);
        expect(food).toBe(space);
      });

      it('has a par equal to the fewest possible cuts', () => {
        expect(minCuts(level, level.par + 1)).toBe(level.par);
      });
    });
  }
});
