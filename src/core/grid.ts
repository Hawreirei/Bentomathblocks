import type { Topping, ToppingGrid } from './types';

/** A plain grid of the given size. */
export function plainGrid(w: number, h: number): ToppingGrid {
  return Array.from({ length: h }, () => '.'.repeat(w));
}

export function toppingAt(grid: ToppingGrid, x: number, y: number): Topping {
  return grid[y].charAt(x) as Topping;
}

/** Columns [from, to) of every row. */
export function sliceColumns(grid: ToppingGrid, from: number, to: number): ToppingGrid {
  return grid.map((row) => row.slice(from, to));
}

/** Rows [from, to). */
export function sliceRows(grid: ToppingGrid, from: number, to: number): ToppingGrid {
  return grid.slice(from, to);
}

/** Turns a grid a quarter turn clockwise. A grid h tall and w wide becomes w tall and h wide. */
export function rotateClockwise(grid: ToppingGrid): ToppingGrid {
  const h = grid.length;
  const w = grid[0].length;
  const out: string[] = [];
  for (let r = 0; r < w; r++) {
    let row = '';
    for (let c = 0; c < h; c++) row += grid[h - 1 - c].charAt(r);
    out.push(row);
  }
  return out;
}

/** True when the grid is a w × h rectangle of known topping codes. */
export function isValidGrid(grid: ToppingGrid, w: number, h: number): boolean {
  return grid.length === h && grid.every((row) => row.length === w && /^[.SEN]*$/.test(row));
}
