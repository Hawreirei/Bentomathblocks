import { describe, expect, it } from 'vitest';
import { applyStroke } from '../src/core/cut';
import { isValidGrid } from '../src/core/grid';
import { checkBoxPlacement } from '../src/core/place';
import { replaySolution } from '../src/core/replay';
import { isSolved } from '../src/core/rules';
import { minCuts } from '../src/core/solver';
import { initialState } from '../src/core/state';
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

      it('has the same toppings in the food as in the box', () => {
        const count = (grids: string[][]) => {
          const tally: Record<string, number> = {};
          for (const g of grids) for (const ch of g.join('')) tally[ch] = (tally[ch] ?? 0) + 1;
          return tally;
        };
        const plain = (w: number, h: number) => Array.from({ length: h }, () => '.'.repeat(w));
        expect(count(level.ingredients.map((i) => i.toppings ?? plain(i.w, i.h)))).toEqual(
          count(level.compartments.map((c) => c.toppings ?? plain(c.w, c.h))),
        );
      });

      it('can be finished at par under the real game rules', () => {
        const result = replaySolution(level, level.solution);
        if (!result.ok) throw new Error(`solution fails at step ${result.step}: ${result.reason}`);
        expect(result.state.cuts).toBe(level.par);
      });

      it('cannot be finished in fewer cuts than par', () => {
        // The solver is more forgiving than the real game, so if even it needs par cuts, nobody can do better.
        expect(minCuts(level, level.par + 1)).toBe(level.par);
      });
    });
  }
});

describe('no dead ends', () => {
  // Whatever a player cuts, more cuts can always rescue the level: cutting everything
  // down to single cells always packs, because the food and the box hold the same toppings.
  for (const level of LEVELS) {
    it(`${level.id} can always be finished by cutting everything into single cells`, () => {
      let state = initialState(level);
      for (let line = 1; line < level.board.w; line++) state = applyStroke(state, 'vertical', line)?.state ?? state;
      for (let line = 1; line < level.board.h; line++) state = applyStroke(state, 'horizontal', line)?.state ?? state;
      expect(state.pieces.every((p) => p.w === 1 && p.h === 1)).toBe(true);

      for (const comp of level.compartments) {
        for (let y = comp.y; y < comp.y + comp.h; y++) {
          for (let x = comp.x; x < comp.x + comp.w; x++) {
            const fit = state.pieces.find((p) => p.area === 'board' && checkBoxPlacement(level, state, p, x, y).ok);
            expect(fit, `no single cell fits box cell (${x}, ${y})`).toBeDefined();
            state = { ...state, pieces: state.pieces.map((p) => (p.id === fit!.id ? { ...p, area: 'box' as const, x, y } : p)) };
          }
        }
      }
      expect(isSolved(level, state)).toBe(true);
    });
  }
});

describe('solution replay', () => {
  const level = LEVELS[1];

  it('rejects a solution that leaves the box unfilled', () => {
    expect(replaySolution(level, [])).toMatchObject({ ok: false, reason: 'the box is not full at the end' });
  });

  it('rejects a step that breaks the topping rule', () => {
    const result = replaySolution(level, [{ cut: 'vertical', line: 3 }, { pack: [3, 1], to: [0, 0] }]);
    expect(result).toMatchObject({ ok: false, step: 2 });
  });
});
