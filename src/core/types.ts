/**
 * A topping code for one cell.
 * '.' plain, 'S' salmon slice, 'E' edamame, 'N' nori.
 */
export type Topping = '.' | 'S' | 'E' | 'N';

/** Rows of topping codes, top to bottom. Every row has the same length. */
export type ToppingGrid = string[];

export type Kind = 'rice' | 'tamago' | 'salmon' | 'tofu' | 'sausage' | 'carrot';

export type Orientation = 'vertical' | 'horizontal';

/** How a compartment's target is written on its label. */
export type LabelType = 'count' | 'product' | 'missing';

export interface CompartmentDef {
  /** Position and size in box cells. */
  x: number;
  y: number;
  w: number;
  h: number;
  label: LabelType;
  /** Required topping per cell. Omitted means every cell is plain. */
  toppings?: ToppingGrid;
}

export interface IngredientDef {
  kind: Kind;
  w: number;
  h: number;
  /** Starting position on the cutting board, in board cells. */
  x: number;
  y: number;
  toppings?: ToppingGrid;
}

export interface LevelDef {
  id: string;
  world: number;
  title: string;
  hint: string;
  box: { w: number; h: number };
  board: { w: number; h: number };
  compartments: CompartmentDef[];
  ingredients: IngredientDef[];
  par: number;
}

export type Area = 'board' | 'box';

export interface Piece {
  id: number;
  kind: Kind;
  w: number;
  h: number;
  toppings: ToppingGrid;
  area: Area;
  /** Top-left cell in the coordinates of its area. */
  x: number;
  y: number;
}

export interface GameState {
  pieces: Piece[];
  cuts: number;
  nextId: number;
}

/** A number sentence produced by a cut. */
export interface Sentence {
  /** e.g. "4 × 5 = 4 × 3 + 4 × 2" */
  factors: string;
  /** e.g. "20 = 12 + 8" */
  totals: string;
}
