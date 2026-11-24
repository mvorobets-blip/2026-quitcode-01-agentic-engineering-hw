# Tetris on the Porsche Design System

A small Tetris game, built for QuitCode Workshop 1 (vibe coding with a design system).
The UI is made of Porsche Design System components (`PHeading`, `PButton`, `PText`);
the board and the "Next" preview are plain grid cells.

## Run

Needs Node 22.18 or newer (`npm test` runs the TypeScript tests directly, without a build step).

```bash
npm install
npm run dev           # http://localhost:5173
npm run build         # type-check + production build
npm test              # rules of the game, node:test, no extra dependencies
npm run test:mutants  # proves the tests catch the known bugs (see docs/verification.md)
```

Controls: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause.
`?seed=123` in the URL replays the same game: same pieces, same order (useful for bug reports).

## How it is built

- `src/index.css` imports the PDS global stylesheet first — PDS v4 components read their colours
  and fonts from it and look unstyled without it.
- `src/tetris.ts` — all rules as pure functions, no React: board checks, line clearing,
  scoring (100 / 300 / 500 / 800), and one locking step `lockPiece` that merges the piece,
  clears lines, scores and spawns the next piece. It also ends the game on **lock-out**
  (a piece locks with any cell above the board — stricter than the Tetris Guideline, which
  needs the whole piece above; chosen because those cells could not be stored) and
  **block-out** (the next piece does not fit). Rotation has no wall kicks.
- `src/App.tsx` — one `useReducer` over those functions. The piece generator's state lives
  inside the game state (seeded mulberry32), so the reducer is pure and deterministic: React
  `StrictMode` calls it twice in development and still counts each cleared line once.
- `src/tetris.test.ts` — 11 tests for the rules, the two review bugs (double line count,
  late game over) and purity of every transition.
