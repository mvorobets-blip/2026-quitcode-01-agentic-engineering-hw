# A/B: basic vs structured prompt (Task 4, bonus)

Done on 2026-11-23, after the review — not part of the original submission.

**Subtask from Task 2:** the "Next" panel shows only the piece letter (`PTag`); make it show the
piece shape.

**Setup, same for both:** Claude Code 2.1.325 · Opus 5.5 · `claude -p` in a new session (clean
context) · each run in its own clean copy of the code at `b2b1b5b` (the submitted version, before
the review fixes) · `--permission-mode acceptEdits`, Bash limited to `npm run build` / `npm run lint`.
One run per prompt — an observation, not statistics. Full prompts, diffs and transcripts:
[`ab/run-a.md`](ab/run-a.md), [`ab/run-b.md`](ab/run-b.md).

## The two prompts

**A — basic:**

```text
зроби щоб у блоці Next показувалась фігура
```

**B — structured** (role + context + constraints + acceptance criteria + format):

```text
Роль: React + TypeScript розробник, який працює з Porsche Design System (PDS).

Контекст: Tetris у `app/` (Vite, React 19). Правила гри — `app/src/tetris.ts` (фігури в `SHAPES`,
кольори в `COLORS`), UI — `app/src/App.tsx`. Зараз панель «Next» показує лише літеру фігури в `PTag`.

Задача: панель «Next» має показувати форму наступної фігури її кольором — міні-сітку 4×2 з тих самих
клітинок, що й дошка.

Обмеження:
- не змінюй ігрову логіку (рух, падіння, очки) і публічні функції `tetris.ts`, лише додай одну чисту
  функцію, якщо потрібна;
- без нових залежностей; підпис «Next» лишається `PText`, як зараз;
- стилі — у `app/src/App.css`.

Критерії приймання:
- для кожного з 7 типів видно правильну форму в стартовому повороті, без зсуву за межі сітки;
- колір клітинок збігається з `COLORS`;
- є `aria-label` з назвою фігури;
- `cd app && npm run build` проходить.

Формат відповіді: список змінених файлів, коротко що зроблено, вивід `npm run build`. Після цього зупинись.
```

## Numbers (from the final `result` line of each run, quoted at the end of `ab/run-a.md` / `ab/run-b.md`)

| | A — basic | B — structured |
|---|---|---|
| Turns | 15 | 10 |
| Tool calls | 14 | 9 |
| — reading the code | 4 (1 grep + 3 Read) | 2 (one `cat` of 3 files + 1 Read) |
| — editing (successful) | 7 Edit | 5 Edit |
| — build | 1 | 1 |
| — refused commands (not in the allowed list) | 2 (`git commit`) | 1 (append CSS + `npx tsx` check in one command; CSS then added by an Edit) |
| Output tokens | 4 154 | 3 954 |
| Cache read / cache write | 324 381 / 33 144 | 219 490 / 30 945 |
| Cost | $0.413 | $0.371 |
| Wall time | 40.8 s | 41.9 s |
| Diff | 3 files, +67 / −2 | 3 files, +46 / −2 |
| `npm run build` | passes | passes |
| Game logic touched | no | no |

## Quality against B's acceptance criteria

| Criterion | A | B |
|---|---|---|
| Correct shape for all 7 pieces, inside the grid | yes | yes |
| Colour from `COLORS` | yes | yes |
| Accessible name | `aria-label` on a plain `div`, no `role` — many screen readers skip it | `role="img"` + `aria-label` |
| Fixed 4×2 grid, same cells as the board | no — the grid size follows the piece (I is 4×1, O is 2×2); it sits centred in a fixed-height box, so the panel itself does not jump | yes, shape centred |

## Conclusion

Both prompts produced a working preview: for a small, familiar UI task the basic prompt is not
"broken". The clear gain from the structured prompt is **quality**: it asked for, and got, a fixed
4×2 grid with the same cells as the board (what the final app uses); A left that to chance and got a
grid that changes size per piece. On accessibility, B's prompt only required an `aria-label`. A also
added one. B's `role="img"`, which makes screen readers announce that label, was a bonus of this
particular run, not something the prompt guaranteed. A re-run would need "`role="img"`" in the
criteria to be sure of it.

The **efficiency** difference is smaller than the turn count suggests. B used 5 fewer tool calls, but
2 of A's were refused `git commit` attempts: A followed the "commit after each iteration" rule in
`AGENTS.md`, while B's prompt ended with "stop" and suppressed that step (B had its own refused
command, so refused calls are 2 vs 1). A spent 2 more calls reading the code to find the scope that
B's prompt named directly, and 2 more on edits. Tokens: B used ~5 % fewer output tokens (3 954 vs
4 154) and ~32 % less cache read (219k vs 324k). Cost was ~10 % lower for B ($0.371 vs $0.413), and
wall time was about the same (B 1 s slower). With one run per prompt, these differences are within
what a re-run could change; the grid difference is not, because it comes straight from B's
acceptance criteria.

**My take:** I agree with this result — the structured prompt is worth it for the quality it pins
down, not for speed.
