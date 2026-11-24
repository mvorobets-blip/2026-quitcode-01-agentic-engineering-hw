# Vibe notes — WS1 homework

**App:** Tetris, built on top of the Porsche Design System (Task 1 asked for a
DS-connected app; I picked a small game instead of the default "Lead Desk"
idea, per the walkthrough's "or your own, similar scale" option).

**Agent:** Claude Code (Sonnet 5), inside the Claude desktop app.

> Rewritten on 2026-11-23/24 after the review. The first version was written by
> the agent in its own voice and claimed the game worked "in one shot" — that was
> not true (see below).

## Prompts / iterations

Three main prompts, each landing as its own commit:

1. *"create vite app and connect the Porsche Design System v4 design system
   and show on the p-heading and p-button page"* → commit `f55f8e9`
2. *"in task 2 create simple Tetris game"* → commit `1ec3feb`
3. *"add logic to pause the game"* → commit `dc55342`

Plus small clarifying turns in between (browser checks, a build-error fix).

## What the first prompts got right and wrong

Worked from the first prompt:

1. **Vite scaffold + PDS wiring** — `npm create vite` (React + TS),
   `PorscheDesignSystemProvider`, `PHeading` / `PButton` on the page, build green.
2. **A playable Tetris from one line** — all 7 pieces with rotation, gravity,
   arrow keys + Space hard drop, line clearing and scoring, restart.
3. **Pause from one line** — keyboard toggle, overlay and a sidebar button.

Did not work (found later, most of it only by the review):

4. **Game rules were wrong in dev mode** — one cleared line counted as two
   (Score 200 / Lines 2), and game over came one piece too late. Smaller ones:
   pieces spawned at the left wall, a piece locking above the board was silently
   cut off, "Next" showed only a letter.
5. **The Porsche styling was never on** — the required PDS stylesheet was not
   imported, so buttons were transparent and fonts were system fonts (details
   below). Also minor: `PTag` has no `color` prop in PDS `^4.7.0` — caught by
   `tsc` in `npm run build`.

## Where I stepped in

- **Tested in the browser myself, but only briefly.** I noticed the game lagged
  and had glitches, but did not dig into them, and the PR still said everything
  works. The submitted version had **no tests**, so the real bugs were only
  named by the review.
- **Asked for pause.** It was not in the first Tetris version; prompt 3 adds it.
- **Questioned the "it's the preview tool" excuse** on the resubmission (below).

## Where the agent stumbled, and the prompt that turned it around

**Porsche styling.** In the original session the Porsche look did not appear in
the agent's preview pane. The agent first added a loader script to
`index.html`, which crashed the page (`document.body.appendChild` ran before
`<body>` existed), reverted it, and then blamed the preview pane ("a
network/CSP restriction, not a config bug"). I accepted that and gave **no
redirect prompt** in that session — I did not know enough about PDS to doubt it.

The diagnosis was wrong. PDS v4 **requires** its global stylesheet
(`@import '@porsche-design-system/components-react/index.css'`, with the colour
variables and Porsche fonts), and the app never imported it. The components
worked (clicks, layout) but rendered unstyled in the browser, not only in the
preview.

It was found on the resubmission. After the review fixes the agent re-checked
the game in the browser only by numbers (score, lines). My prompt, exactly as
typed:

> are you sure desihn system is showing?

The agent then inspected the components inside their shadow DOM, found
transparent buttons and system fonts, and traced it to the missing import via
the PDS package's own docs. The fix is one line in `app/src/index.css`.

**The lag** — I did not ask the agent about it at the time. A likely cause,
seen later in the code: every key press and gravity tick went through several
separate React state updates, with side effects queued from inside them; the
rewrite does one reducer step per action. Not measured, so a guess, not a result.

## Fixes after the review (2026-11-23/24)

Done in a new Claude Code session (Opus 5.5), with the instructor's review
comments as the task list. I set the order and the rules (fix only what the
review names, add tests, nothing committed or pushed without my OK), and had
independent agents re-check the result against the review and the walkthrough
before pushing. How everything was checked, with re-runnable commands:
[`verification.md`](verification.md).

- Lock → clear lines → score → spawn is now one pure function (`lockPiece` in
  `app/src/tetris.ts`) driven by a single `useReducer`; the piece generator lives
  in the game state, so React StrictMode can run the reducer twice without
  double counting. In the browser (dev, StrictMode, `?seed=2026`) one cleared
  line now shows **Score 100 / Lines 1**.
- Game over is checked against the board *after* the lock; lock-out added;
  pieces spawn centred; "Next" shows the shape.
- `npm test`: 11 tests. `npm run test:mutants` shows they matter: a baseline
  test is red on the submitted code, and each of 7 known bugs, put back into a
  temp copy of the code, makes at least one test fail.
- Porsche Design System styles switched on: the required global stylesheet is
  now imported, so buttons, headings and fonts look like PDS (see
  `verification.md`, section 4).
- After Start / Restart the button loses focus, so Enter no longer restarts
  the game mid-play (found by an independent re-check).
- Vite leftovers replaced (`app/README.md`, `index.css`, page title).
- Bonus A/B experiment: [`ab-experiment.md`](ab-experiment.md).

## Numbers (original session)

- **Iterations:** 3 main prompts → 3 commits, 146 requests in the session per
  Claude Code's usage report.
- **Tokens (`/cost`):** 422 in / 56.9k out / 27.8M cache read / 982.9k cache write.
- **Cost:** $5.16 (API time 9m, wall-clock 619m — mostly the human side).

## Next time

1. **Check better** — play-test against a list of rules (line count, game over,
   spawn), not just "it runs", and check that the design system really renders
   (colours, fonts) instead of accepting "the preview tool is to blame".
2. **Prepare a better plan** before prompting: scope, acceptance criteria and
   how each will be checked.
3. **Run a code review and an independent agent** on the result before
   submitting, and keep tests in the repo so the review can re-run them.
