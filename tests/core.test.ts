import { describe, expect, it } from 'vitest';
import { applyStroke, cutSentence, piecesCrossed, splitPiece } from '../src/core/cut';
import { History } from '../src/core/history';
import { canPlaceOnBoard, checkBoxPlacement, filledCells } from '../src/core/place';
import { isSolved, labelText, starsFor } from '../src/core/rules';
import { initialState } from '../src/core/state';
import type { GameState, LevelDef, Piece } from '../src/core/types';

const piece = (over: Partial<Piece>): Piece => ({
  id: 1,
  kind: 'rice',
  w: 3,
  h: 2,
  toppings: ['S..', '..E'],
  area: 'board',
  x: 0,
  y: 0,
  ...over,
});

const level: LevelDef = {
  id: 't',
  world: 1,
  title: 'test',
  hint: '',
  box: { w: 3, h: 2 },
  board: { w: 6, h: 5 },
  compartments: [
    { x: 0, y: 0, w: 2, h: 2, label: 'count', toppings: ['S.', '..'] },
    { x: 2, y: 0, w: 1, h: 2, label: 'missing', toppings: ['.', 'E'] },
  ],
  ingredients: [{ kind: 'rice', w: 3, h: 2, x: 1, y: 1, toppings: ['S..', '..E'] }],
  par: 1,
  solution: [],
};

describe('cutting', () => {
  it('splits a piece vertically, keeping toppings and positions', () => {
    const [a, b] = splitPiece(piece({ x: 2, y: 1 }), 'vertical', 2, [7, 8]);
    expect(a).toMatchObject({ id: 7, w: 2, h: 2, x: 2, y: 1, toppings: ['S.', '..'] });
    expect(b).toMatchObject({ id: 8, w: 1, h: 2, x: 4, y: 1, toppings: ['.', 'E'] });
  });

  it('splits a piece horizontally', () => {
    const [a, b] = splitPiece(piece({}), 'horizontal', 1, [2, 3]);
    expect(a).toMatchObject({ w: 3, h: 1, y: 0, toppings: ['S..'] });
    expect(b).toMatchObject({ w: 3, h: 1, y: 1, toppings: ['..E'] });
  });

  it('refuses a cut along an edge', () => {
    expect(() => splitPiece(piece({}), 'vertical', 3, [2, 3])).toThrow(RangeError);
  });

  it('writes the number sentence for a cut', () => {
    expect(cutSentence(4, 5, 'vertical', 3)).toEqual({ factors: '4 × 5 = 4 × 3 + 4 × 2', totals: '20 = 12 + 8' });
    expect(cutSentence(4, 4, 'horizontal', 1)).toEqual({ factors: '4 × 4 = 1 × 4 + 3 × 4', totals: '16 = 4 + 12' });
  });

  it('one stroke cuts every board piece it crosses and counts once', () => {
    const state: GameState = {
      cuts: 0,
      nextId: 4,
      pieces: [
        piece({ id: 1, x: 1, y: 0, w: 4, toppings: ['....', '....'] }),
        piece({ id: 2, x: 3, y: 3, w: 4, toppings: ['....', '....'] }),
        piece({ id: 3, x: 0, y: 0, area: 'box' }),
      ],
    };
    expect(piecesCrossed(state, 'vertical', 4).map((p) => p.id)).toEqual([1, 2]);
    const result = applyStroke(state, 'vertical', 4);
    expect(result).not.toBeNull();
    expect(result!.state.cuts).toBe(1);
    expect(result!.state.pieces).toHaveLength(5);
    expect(result!.sentences.map((s) => s.factors)).toEqual(['2 × 4 = 2 × 3 + 2 × 1', '2 × 4 = 2 × 1 + 2 × 3']);
    expect(state.pieces).toHaveLength(3);
  });

  it('a stroke that misses every piece does nothing', () => {
    const state = initialState(level);
    expect(applyStroke(state, 'vertical', 1)).toBeNull();
    expect(applyStroke(state, 'horizontal', 3)).toBeNull();
  });
});

describe('placing', () => {
  it('keeps board pieces on the board and apart', () => {
    const state = initialState(level);
    const p = state.pieces[0];
    expect(canPlaceOnBoard(level, state, p, 3, 3)).toBe(true);
    expect(canPlaceOnBoard(level, state, p, 4, 3)).toBe(false);
    const other = piece({ id: 9, x: 0, y: 0, w: 2, h: 1 });
    const crowded = { ...state, pieces: [...state.pieces, other] };
    expect(canPlaceOnBoard(level, crowded, p, 0, 0)).toBe(false);
  });

  it('accepts a piece that fits a compartment with matching toppings', () => {
    const state = initialState(level);
    const [left] = splitPiece(state.pieces[0], 'vertical', 2, [5, 6]);
    expect(checkBoxPlacement(level, state, left, 0, 0)).toEqual({ ok: true, compartment: 0 });
  });

  it('rejects pieces that cross a divider, overlap, or mismatch toppings', () => {
    const state = initialState(level);
    const whole = state.pieces[0];
    expect(checkBoxPlacement(level, state, whole, 0, 0)).toMatchObject({ ok: false, reason: 'outside' });

    const [left, right] = splitPiece(whole, 'vertical', 2, [5, 6]);
    const placed: GameState = { ...state, pieces: [{ ...left, area: 'box', x: 0, y: 0 }, right] };
    const small = piece({ id: 7, w: 1, h: 1, toppings: ['.'] });
    expect(checkBoxPlacement(level, placed, small, 1, 1)).toMatchObject({ ok: false, reason: 'overlap' });
    expect(checkBoxPlacement(level, placed, small, 2, 1)).toMatchObject({ ok: false, reason: 'topping', cell: { x: 2, y: 1 } });
    expect(checkBoxPlacement(level, placed, right, 2, 0)).toMatchObject({ ok: true, compartment: 1 });
  });
});

describe('rules', () => {
  it('is solved only when every compartment is full', () => {
    const state = initialState(level);
    const [left, right] = splitPiece(state.pieces[0], 'vertical', 2, [5, 6]);
    const half: GameState = { ...state, pieces: [{ ...left, area: 'box', x: 0, y: 0 }, right] };
    expect(filledCells(half, level.compartments[0])).toBe(4);
    expect(isSolved(level, half)).toBe(false);
    const full: GameState = { ...half, pieces: [half.pieces[0], { ...right, area: 'box', x: 2, y: 0 }] };
    expect(isSolved(level, full)).toBe(true);
  });

  it('gives stars by cuts against par', () => {
    expect(starsFor(0, 1)).toBe(3);
    expect(starsFor(1, 1)).toBe(3);
    expect(starsFor(2, 1)).toBe(2);
    expect(starsFor(5, 1)).toBe(1);
  });

  it('writes compartment labels', () => {
    const comp = { x: 0, y: 0, w: 4, h: 3, toppings: undefined };
    expect(labelText({ ...comp, label: 'count' }, false)).toBe('12');
    expect(labelText({ ...comp, label: 'product' }, false)).toBe('3 × 4');
    expect(labelText({ ...comp, label: 'missing' }, false)).toBe('3 × ? = 12');
    expect(labelText({ ...comp, label: 'missing' }, true)).toBe('3 × 4 = 12');
  });
});

describe('history', () => {
  it('restores earlier snapshots in reverse order', () => {
    const h = new History();
    const s = initialState(level);
    h.push(s);
    s.cuts = 5;
    h.push(s);
    expect(h.pop()!.cuts).toBe(5);
    expect(h.pop()!.cuts).toBe(0);
    expect(h.pop()).toBeUndefined();
  });
});
