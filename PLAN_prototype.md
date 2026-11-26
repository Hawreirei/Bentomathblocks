# Prototype plan: Bento Math Blocks

A browser puzzle game where children cut grid-shaped food and pack it into lunch-box
compartments. Every cut and every fill is shown as a number sentence, so solving the
puzzle also practises multiplication, the distributive property and fractions.

It borrows the cut-and-pack mechanic from the genre (see `RESEARCH_bento_blocks.md`).
The math layer, art, levels and name are our own.

## 1. Assumptions (change these if they are wrong)

| Topic | Default |
|---|---|
| Players | Ages 8–11, roughly grades 3–5 |
| Math focus | Area as arrays, multiplication, the distributive property; fractions later |
| Platform | Web browser on laptops and tablets (mouse and touch) |
| Language | English only (decided). Text still lives in one strings file, which keeps copy easy to edit |
| Prototype size | 2 worlds, about 16 levels, no accounts, progress saved in the browser |
| Name | "Bento Math Blocks" is a working title. It sits close to the commercial game *Bento Blocks*, so pick a distinct name before any public release (ideas: *Lunchbox Arrays*, *Snack Grid*, *Slice & Sum*) |

## 2. Core rules

1. **Grid.** Each lunch box is a grid of cells, split into one or more
   **compartments**.
2. **Ingredients.** Each ingredient is a rectangle of cells (rice 2×3, tofu 3×4 and
   so on), shown with its dimensions and its cell count.
3. **Cut.** Drag a straight line along a grid line across the cutting board. One knife
   stroke counts as one cut and splits every piece it crosses all the way through.
   (Example: a cross of two strokes turns a 4×4 block into four 2×2 pieces.)
4. **Toppings.** Some cells carry a topping (salmon, edamame, nori and so on); the
   rest are plain. Each box cell shows a faint outline of the topping it needs, or
   nothing if it needs a plain cell.
5. **Pack.** Drag pieces into a compartment. Pieces snap to the grid, must not
   overlap, must sit inside one compartment, and every topping must land on its
   matching outline.
6. **Win.** The level is solved when every compartment is full and every topping
   matches. The total area of the ingredients always equals the box area, so every
   piece gets used.
7. **Stars.** Each level has a par cut count. Solving at par gives 3 stars, par + 1
   gives 2, and any other solve gives 1. There is no timer and no fail state.
8. **Undo and reset** are always available.
9. **Pieces never turn.** Every piece keeps the direction it starts in, so where
   and in which order you cut is the puzzle.

## 3. The math layer (what makes it more than a reskin)

- **Cut equations.** Each cut shows its number sentence:
  cutting a 4×6 block into 4×2 and 4×4 shows `4 × 6 = 4 × 2 + 4 × 4 → 24 = 8 + 16`.
- **Compartment targets.** Each compartment is labelled with what it needs. The label
  gets harder by world: first a count (`12`), then a product (`3 × 4`), then a
  missing number (`3 × ? = 12`).
- **Fill counter.** Each compartment shows how full it is, for example `8 / 12`.
- **Stamp book.** Every equation a player makes is stamped into a collection page
  to review later.

## 4. Prototype content

### World 1: Arrays (8 levels)
Teaches cutting, packing, area and multiplication. Cuts are vertical only at first,
then both directions. Compartments are labelled with counts.

### World 2: Split & Add (8 levels)
Teaches the distributive property. Compartments are labelled with products, then
missing numbers. Later levels need cuts in two directions, in the right order.

### Stretch: World 3, Fraction Bento
Compartments labelled `½ of the box` or `¼ of the box`; cut an ingredient into equal
parts before packing.

### Sample levels

| # | Box and compartments | Ingredients | Par | What it teaches |
|---|---|---|---|---|
| 1-1 | 2×3, one compartment | rice 2×3 | 0 | Drag and drop; 2 × 3 = 6 |
| 1-2 | 2×3, compartments 2×2 and 2×1 | rice 2×3 | 1 | First cut: 2×3 = 2×2 + 2×1 |
| 1-3 | 4×4, one compartment | sausage 2×6, egg 2×2 | 1 | Cut to fit: 2×6 → 2×4 + 2×2 |
| 1-4 | 3×4, compartments 3×1, 3×1, 3×2 | tofu 3×4 | 2 | Several cuts on one piece |
| 2-1 | 4×5, compartments `4 × 3` and `4 × 2` | omelette 4×5 | 1 | 4×5 = 4×3 + 4×2 |
| 2-4 | 3×6 box: 2×4, 2×2 and 1×6 | tofu 3×6 | 2 | Cut across first, then down; order matters |

## 5. Technology

| Part | Choice | Why |
|---|---|---|
| Language | TypeScript | Type-safe game logic |
| Build | Vite | Fast setup, static build output |
| Rendering | Positioned HTML elements on a grid, with inline SVG for toppings and icons; no game engine | A grid puzzle doesn't need an engine, and plain elements make dragging simple |
| Input | Pointer Events | One code path for mouse, touch and pen |
| Tests | Vitest | Covers the core rules without a browser |
| Levels | JSON files in `levels/` | Easy to write and change by hand |
| Saving | `localStorage`, wrapped in try/catch | Stars and unlocks, no server needed |
| Hosting | GitHub Pages or Netlify | Free static hosting |

### Code layout

```
src/
  core/            pure logic, no DOM, fully unit-tested
    types.ts       Cell, Piece, Compartment, Level, GameState
    cut.ts         split a piece along a grid line, returning 2 pieces and the equation
    place.ts       fit, overlap, in-compartment and topping-match checks; snapping
    rules.ts       win check, star scoring, label text
    history.ts     undo stack
  ui/
    render.ts      draws board, pieces, labels and equations as SVG
    input.ts       drag to cut, drag to move
    screens.ts     title, world map, level, stamp book
  data/strings.ts  all player-facing text, ready for translation
levels/            world1.json, world2.json
tools/solver.ts    checks a level is solvable and finds its minimum cut count
tests/             Vitest specs for core/ and the solver
```

### Level format

```json
{
  "id": "1-3",
  "box": { "w": 4, "h": 4 },
  "compartments": [
    {
      "x": 0, "y": 0, "w": 4, "h": 4,
      "label": { "type": "count", "value": 16 },
      "toppings": ["....", ".S..", "....", "...E"]
    }
  ],
  "ingredients": [
    { "kind": "sausage", "w": 6, "h": 2, "toppings": ["......", ".S...."] },
    { "kind": "egg", "w": 2, "h": 2, "toppings": ["..", ".E"] }
  ],
  "par": 1
}
```

### Solver

A level designer needs to know that a level can be solved and what its true minimum
cut count is. `tools/solver.ts` runs a breadth-first search over cut states (fewest
cuts first). For each state it checks whether the pieces exactly fill the
compartments, using backtracking. Boxes up to 6×6 are small enough for this. A
`npm run check-levels` script runs it over every level and fails if a level is
unsolvable or its par is wrong.

## 6. Milestones

| # | Deliverable | Done when | Status |
|---|---|---|---|
| M0 | Project setup: Vite, TypeScript, Vitest, lint, CI | `npm test` and `npm run build` pass in CI | Passes locally; CI workflow added; no linter yet |
| M1 | Core logic: cut, place, win, stars, undo | Unit tests cover every rule in section 2 | Done |
| M2 | Playable UI with levels 1-1 to 1-4 | Playable start to finish with mouse and touch | Done |
| M3 | Math layer: cut equations, compartment labels, fill counters | Each cut and compartment shows the correct sentence | Done |
| M4 | Solver and level checker; all 16 levels authored | `check-levels` passes; every par is the proven minimum | Solver done; 11 of 16 levels |
| M5 | Progress, world map, stamp book, simple art and sound | Stars and unlocks survive a page reload | Progress and map done; no stamp book or sound |
| M6 | Playtest with 3–5 children, then fix what they hit | Findings written up, top issues fixed | Not started |

M0–M3 make the first playable test. M4–M6 turn it into the full prototype.

## 7. Playtest questions

- Can a child solve 1-1 and 1-2 without anyone explaining?
- Do children read the cut equations, or ignore them?
- Which levels take longest, and where do children give up?
- Do children replay a level to earn 3 stars?
- Can a child explain 4×6 = 4×2 + 4×4 after World 2? (Ask before and after.)

## 8. Out of scope for the prototype

Accounts, teacher dashboards, leaderboards, non-rectangular ingredients, timed modes,
app-store builds, and finished art. Placeholder art uses flat coloured blocks with a
food icon.

## 9. Decisions needed from you

1. Target age or grade, and which curriculum topics matter most.
2. Final name.
