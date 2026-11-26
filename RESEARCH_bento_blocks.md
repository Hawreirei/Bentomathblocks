# Research notes: *Bento Blocks* (Steam, 2026)

Compiled 2026-11-26 from web search results. The store pages themselves could not be
opened from this environment, so figures below come from search snippets and may lag
the live store page. Conflicting figures are flagged.

## Basic facts

| Item | Detail | Source |
|---|---|---|
| Developer / publisher | SOMETIMES LIMITED (independent studio, New Zealand) | Steam, sometimes.ltd |
| Release | 29 Jan 2026 (30 Jan in Japan, time-zone difference) | SteamDB, GameWith |
| Platform | PC (Windows) on Steam. One listing says Steam Deck Verified. No Switch version found | SteamDB, Metacritic |
| Price | US$14.99 list. Seen at $11.39–$11.99 on sale (20–22% off) | Steam, Steambase |
| Demo | Free Steam demo, app 3529740, released 20 Feb 2025 | SteamDB |
| Content | "180+ hand-crafted puzzles" (Steam). Studio site says "100+", probably written before launch | Steam, sometimes.ltd |
| Languages | 8 | Steambase |
| Extras | Steam Achievements | Steambase |
| Reviews | Very Positive: 97% of 440 (an earlier snapshot showed 98% of 292) | Steam |
| Genre tags | Cozy, puzzle, "thinky" | Thinky Games |

## How to play

**Goal:** fill a bento (lunch) box completely with ingredients, using as few knife cuts
as possible.

1. **Cut.** Drag a knife line across an ingredient to slice it. Ingredients are
   block-shaped, so a cut splits one block-shape into smaller ones along the grid.
2. **Pack.** Drag and drop the pieces into the lunch-box grid.
3. **No rotating pieces.** Ingredients generally cannot be rotated. Because a piece
   keeps its orientation, where you place the cut decides whether the pieces fit.
4. **Fill the box.** The stage is solved when the box is filled.
5. **Stars.** Each stage has a target (ideal) cut count. Fewer cuts give more stars,
   up to 3. The top rating needs efficient cuts, such as:
   - one cut that slices several ingredients in a single pass
   - two cuts that leave an L-shaped or cross-shaped piece
6. **No pressure.** There is no timer and no fail state. You can retry freely.

## Progression and mechanics introduced over time

- **Early stages:** the cut direction is fixed to horizontal or vertical.
- **Later stages:** the cut direction can be rotated (you choose the direction).
  This is separate from piece rotation, which stays off.
- **Box dividers:** compartments split the box into smaller areas you must fill
  separately.
- **Box shape changes:** the boxes stop being plain rectangles.
- **Courses:** stages are grouped into courses. Your total stars unlock new courses.
- **Scenery:** new backgrounds unlock as you progress.

## Reception

**Praised:** a relaxing, cozy mood; cute food art; the optional cut-count challenge,
which one curator called "a bit of extra spice" on an easy-going puzzle.

**Criticised** (mostly from Vaporlens, an AI-generated summary of reviews, so treat as
second-hand):
- no tutorial, so the controls can be unclear at first
- low framerate for some players
- no story
- seen as pricier and less engaging than the similar game *Inbento*

## Similar games

- ***Inbento*** (Afterburn, 2019): bento-box puzzles about copying and arranging food
  patterns. It is the closest comparison reviewers make.
- Polyomino-packing and "cut the shape" puzzles in general.

## Design takeaways for a math version (Bento Math Blocks)

The core loop maps onto school math topics:

- **Area and multiplication:** a box of a × b cells must be filled exactly, so the
  total cell count of the pieces must equal a × b.
- **Factor pairs and partitioning:** cutting a 4×6 block into 4×2 + 4×4 shows the
  distributive law: 4×6 = 4×2 + 4×4.
- **Fractions:** cutting an ingredient into halves or thirds before packing it.
- **Optimisation:** the "fewest cuts" target is a small minimisation puzzle on its own.

These notes describe the genre and its mechanics. Any game built from them should use
its own name, art, characters and levels rather than copying *Bento Blocks*.

## Sources

- Steam store: https://store.steampowered.com/app/3311670/Bento_Blocks/
- Steam demo: https://store.steampowered.com/app/3529740
- SteamDB: https://steamdb.info/app/3311670/info/
- Developer site: https://sometimes.ltd/
- Thinky Games: https://thinkygames.com/games/bento-blocks/
- 4Gamer (Japanese, 10 Mar 2026): https://www.4gamer.net/games/950/G095079/20260308002/
- GameWith (Japanese): https://gamewith.jp/gamedb/15988
- Vaporlens review summary: https://vaporlens.app/app/3311670/bento_blocks
- Steambase: https://steambase.io/games/bento-blocks/info
- Metacritic: https://www.metacritic.com/game/bento-blocks/
- Inbento (Wikipedia): https://en.wikipedia.org/wiki/Inbento
