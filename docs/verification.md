# Verification of the review fixes (2026-11-23)

How each fix was checked, with commands anyone can re-run from `app/` (Node 22.18+).

## 1. Unit tests — `npm test`

```text
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

`src/tetris.test.ts` covers line clearing (single = 100 / 1 line, double = 300), the
lock step, lock-out, block-out (10 O pieces in one column end the game on the 10th lock, not
one piece later), centred spawn, purity of every transition, and same-seed replay.

## 2. Are the tests meaningful? — `npm run test:mutants`

`scripts/mutation-check.mjs` does two things without touching `src/`:

> Needs the full git history (the baseline reads commit `b2b1b5b`). In a shallow clone run `git fetch --unshallow`
> first; without it the script stops with that hint (exit code 2).

- **Red baseline.** `src/tetris.test.ts` cannot run against the submitted code (`b2b1b5b`):
  `newGame` and `lockPiece` did not exist yet, so it would fail on import, which proves nothing.
  Instead, `scripts/baseline-original.test.ts` checks two review points using only functions
  that already existed, against `git show b2b1b5b:app/src/tetris.ts`.
- **Bugs put back.** Each known bug is written back into a temp copy of the fixed `tetris.ts`,
  and the real test file is run against it.

Output (2026-11-23):

```text
0. original code (b2b1b5b), baseline tests: 2 failed, 0 passed → RED as expected
   fixed code, real tests: 0 failed, 11 passed
1. spawn at the left wall (x = 0): 4 test(s) failed → caught
2. no lock-out: cells above the board are cut off: 1 test(s) failed → caught
3. block-out checked against the OLD board (late game over): 2 test(s) failed → caught
4. cleared line counted twice (the StrictMode bug): 2 test(s) failed → caught
5. mergePiece mutates the board in place: 1 test(s) failed → caught
6. softDrop mutates the piece in place: 2 test(s) failed → caught
7. piece generator not advanced (same piece forever): 1 test(s) failed → caught
OK: baseline red, fixed code green, every mutant caught.
```

Mutants 5 and 6 matter for the StrictMode bug: React runs reducers twice in development,
which is harmless only if they never change their input.

## 3. In the browser (dev mode, StrictMode on)

The review reproduced "one cleared line shows Score 200 / Lines 2" in `npm run dev`.
Re-check with a fixed seed, so the pieces are always the same:

1. `npm run dev`, open `http://localhost:5173/?seed=2026`, click **Start**.
2. In the browser console, send the key sequence below (it clears exactly one line):

```js
const keys = ['ArrowLeft','ArrowLeft','ArrowLeft','ArrowLeft',' ','ArrowLeft',' ','ArrowLeft',' ',
  'ArrowLeft','ArrowLeft',' ','ArrowRight','ArrowRight',' ','ArrowUp','ArrowUp','ArrowUp',
  'ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight',' ']
for (const key of keys) window.dispatchEvent(new KeyboardEvent('keydown', { key }))
```

Result: **Score 100, Lines 1**. This is the same as the pure simulation of the same keys
(`newGame(2026)` + `moveBy` / `rotate` / `hardDrop`), which gives score 100, 1 line, game not
over. Playing on until the stack reaches the top freezes the board and shows **Play again**.
No errors in the console.

After **Start** / **Restart** the button loses focus, so pressing Enter during play no longer
restarts the game.

Space on a focused button presses the button instead of hard-dropping (`src/keys.ts`, tests in
`src/keys.test.ts`; full CodeRabbit review 25.11). Checked with real key presses: Pause clicked, then
Space with focus on «Resume» — the game resumed and the piece stayed near the top; Space with no focused
button still hard-drops the piece to the bottom row.

## 4. Porsche Design System styles really render

PDS v4 needs its global stylesheet (colour variables, `@font-face`, normalize); without it the
components work but look unstyled. `app/src/index.css` now starts with
`@import '@porsche-design-system/components-react/index.css'`.

Checked in the browser console (dev, dark OS theme) by reading the computed style inside the
`p-button` shadow DOM:

| | before the import | after |
|---|---|---|
| `--p-color-primary` on `:root` | not defined | defined (`light-dark(…)`) |
| Primary button background | `rgba(0, 0, 0, 0)` (transparent) | `rgb(250, 251, 255)` |
| Button corner radius | `0px` | `12px` |
| Font of button and body | `system-ui, …` | `"Porsche Next", …` (weights 400 and 600 loaded) |

`npm run build` now emits the PDS CSS (`dist/assets/index-*.css`, 16.9 kB).

## 5. Build and lint

`npm run build` (tsc + vite) and `npm run lint` (oxlint) both finish with no errors.
