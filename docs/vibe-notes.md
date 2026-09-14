# Vibe notes — WS1 homework

**App:** Tetris, built on top of the Porsche Design System (Task 1 asked for a
DS-connected app; I built a small game instead of the default "Lead Desk"
idea, per the walkthrough's "or your own, similar scale" option).

**Agent:** Claude Code (Sonnet 5), inside the Claude desktop app.

## Prompts / iterations

Three substantive vibe-coding prompts, each landing as its own commit:

1. *"create vite app and connect the Porsche Design System v4 design system
   and show on the p-heading and p-button page"* → commit `f55f8e9`
2. *"in task 2 create simple Tetris game"* → commit `1ec3feb`
3. *"add logic to pause the game"* → commit `dc55342`

Plus a handful of small clarifying/verification turns in between (browser
checks, a build-error fix) that didn't need separate commits.

## What worked first try

- Vite scaffold (`npm create vite@latest app -- --template react-ts`) and
  `npm install @porsche-design-system/components-react` — no issues.
- `PorscheDesignSystemProvider` wrapping + `PHeading`/`PButton` usage matched
  the package's own README exactly; no trial and error needed.
- The Tetris prompt was a single line ("create simple Tetris game") and the
  agent produced a fully working game in one shot: all 7 tetrominoes with
  rotations, gravity tick, keyboard controls (arrows + space for hard drop),
  line clearing with scoring, game-over/restart — verified working in the
  browser without a follow-up prompt.
- The pause feature (prompt 3) was also one-shot: state, keyboard toggle,
  overlay, sidebar button, all correct on the first try.

## Where the agent stumbled

- **PDS visual styling didn't show up in the sandboxed preview browser.**
  The `p-button`/`p-heading` custom elements hydrated and behaved correctly
  (padding, click handlers, layout), but the actual Porsche look (dark
  button, brand font, color tokens) is injected at runtime by a script the
  components fetch from `cdn.ui.porsche.com`. That request never completed
  in the tool's preview pane — most likely a network/CSP restriction of the
  sandboxed preview, not a config bug (fetch() to the same URL succeeded
  when called manually from the console). Time was spent debugging this:
  first suspecting a missing `getLoaderScript()`/`getFontLinks()` partial in
  `index.html`, adding one (which actually broke things — a
  `document.body.appendChild` crash because the script ran mid-`<head>`
  parse, before `<body>` existed), then reverting to the plain
  `PorscheDesignSystemProvider` setup once I confirmed via the package's own
  README that no manual script is required.
  - **How I redirected the agent:** no new prompt was needed here — this was
    my own (agent's) debugging dead-end mid-turn, caught and reverted before
    reporting back. Worth flagging in notes since it took real
    tool calls/tokens to figure out and comes down to a preview-tool
    limitation rather than app code.
- Minor: `PTag` doesn't accept a `color` prop in this installed PDS version
  (`^4.7.0`) — a one-line fix caught immediately by `tsc` during
  `npm run build`.

## Numbers

- **Iterations:** 3 main vibe-coding prompts → 3 commits (Task 1, Task 2,
  pause add-on), plus this notes-writing turn — 146 local requests total for
  the session per Claude Code's usage report.
- **Tokens (this session, `/cost`):** 422 in / 56.9k out / 27.8M cache read /
  982.9k cache write.
- **Cost:** $5.16 (API time 9m, wall-clock 619m — most of the wall time was
  the human side of the conversation, not the model thinking).
- The cache-read number (27.8M) dwarfs everything else — expected for a long
  agentic session where the full conversation + tool schemas get replayed
  into context on every turn; it's why the *incremental* cost per prompt
  stays low even late in a long session.

## Observations for next time

1. When wiring up a design system that ships as web components (Shadow DOM +
   CDN-loaded runtime), verify styling in a *real* browser early — a
   sandboxed preview tool can look broken even when the integration is
   correct, and chasing that with more "fixes" makes it worse, not better.
2. One-line prompts worked surprisingly well for well-scoped, self-contained
   features (the whole Tetris game, then pause) — probably because the task
   was familiar/well-represented in training data and had a clear, testable
   definition of "done" (arrows move the piece, space drops it, lines
   clear).
3. Committing after each prompt (as AGENTS.md asks) made it trivial to see
   exactly what each iteration changed and to isolate the one detour (the
   index.html loader-script experiment) without it polluting the real
   history — it was reverted in the same turn instead of becoming a commit.
