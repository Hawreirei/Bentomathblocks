# Bento Math Blocks

A browser puzzle game for ages 8–11. Cut grid-shaped food on a cutting board and pack
it into a lunch box. Every cut is shown as a number sentence, such as
`4 × 5 = 4 × 3 + 4 × 2 → 20 = 12 + 8`, so solving the puzzle practises multiplication
and the distributive property.

Working title. See `PLAN_prototype.md` for the design and `RESEARCH_bento_blocks.md`
for background research.

## Run it

Needs Node 20.19 or newer.

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

## How to play

- **Cut:** start on an empty spot of the cutting board and drag across it. The knife
  snaps to a grid line and cuts every piece the line passes through. One stroke is
  one cut.
- **Pack:** drag pieces into the lunch box. Each piece must sit inside one
  compartment, and each topping must land on its matching outline.
- **Turn:** from World 2, level 2-4 on, tap a piece on the board to turn it.
- **Stars:** finish at or under par for 3 stars, par + 1 for 2, anything else for 1.
- **Undo:** the Undo button, or Ctrl/Cmd + Z.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm test` | Unit tests for the rules, plus a check of every level |
| `npm run check-levels` | Level check only: each level is well formed and its par is the true minimum |
| `npm run build` | Type-check and build a static site into `dist/` |
| `npm run preview` | Serve the built site |

## Project layout

```
src/core/     game rules with no DOM: cutting, placing, scoring, undo, level solver
src/ui/       screens (map, level), drawing, styles, saved progress
src/data/     level list and all player-facing text
levels/       level files, one JSON file per world
tests/        Vitest specs
```

## Adding a level

Add an entry to `levels/world1.json` or `levels/world2.json`. Toppings are written as
rows of characters: `.` plain, `S` salmon, `E` edamame, `N` nori. Then run
`npm run check-levels`. It fails if the level is malformed or if `par` is not the
fewest cuts the solver can find.
