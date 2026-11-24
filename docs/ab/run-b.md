# A/B, прогін B

- 23.11.2026 · Claude Code 2.1.325 · Opus 5.5 · `claude -p`, нова сесія в чистій копії коду `b2b1b5b` (до виправлень за рев'ю)
- Права: `--permission-mode acceptEdits`; з Bash дозволено лише `npm run build` і `npm run lint`
- Транскрипт згенеровано з журналу сесії скриптом; текст не редаговано, лише тимчасові шляхи скорочено до `<tmp>/…`

## Промпт дослівно

```text
Роль: React + TypeScript розробник, який працює з Porsche Design System (PDS).

Контекст: Tetris у `app/` (Vite, React 19). Правила гри — `app/src/tetris.ts` (фігури в `SHAPES`, кольори в `COLORS`), UI — `app/src/App.tsx`. Зараз панель «Next» показує лише літеру фігури в `PTag`.

Задача: панель «Next» має показувати форму наступної фігури її кольором — міні-сітку 4×2 з тих самих клітинок, що й дошка.

Обмеження:
- не змінюй ігрову логіку (рух, падіння, очки) і публічні функції `tetris.ts`, лише додай одну чисту функцію, якщо потрібна;
- без нових залежностей; підпис «Next» лишається `PText`, як зараз;
- стилі — у `app/src/App.css`.

Критерії приймання:
- для кожного з 7 типів видно правильну форму в стартовому повороті, без зсуву за межі сітки;
- колір клітинок збігається з `COLORS`;
- є `aria-label` з назвою фігури;
- `cd app && npm run build` проходить.

Формат відповіді: список змінених файлів, коротко що зроблено, вивід `npm run build`. Після цього зупинись.
```

## Диф результату (`app/src`)

```diff
diff --git a/app/src/App.css b/app/src/App.css
index 26364e3..80f87ae 100644
--- a/app/src/App.css
+++ b/app/src/App.css
@@ -58,3 +58,15 @@
   border-radius: 8px;
   background: rgba(0, 0, 0, 0.05);
 }
+
+.preview {
+  display: grid;
+  grid-template-columns: repeat(4, 1fr);
+  grid-template-rows: repeat(2, 1fr);
+  gap: 1px;
+  background: #1a1a1f;
+  border: 4px solid #1a1a1f;
+  border-radius: 4px;
+  width: 100%;
+  aspect-ratio: 2 / 1;
+}
diff --git a/app/src/App.tsx b/app/src/App.tsx
index 807a686..47d04af 100644
--- a/app/src/App.tsx
+++ b/app/src/App.tsx
@@ -1,9 +1,12 @@
 import { useCallback, useEffect, useRef, useState } from 'react'
-import { PButton, PHeading, PText, PTag } from '@porsche-design-system/components-react'
+import { PButton, PHeading, PText } from '@porsche-design-system/components-react'
 import {
   COLS,
   ROWS,
   COLORS,
+  PREVIEW_COLS,
+  PREVIEW_ROWS,
+  previewCells,
   clearLines,
   createEmptyBoard,
   isValidPosition,
@@ -164,6 +167,7 @@ function App() {
       .map(([x, y]) => `${x},${y}`),
   )
   const activeColor = COLORS[piece.type]
+  const nextCells = new Set(previewCells(nextType).map(([x, y]) => `${x},${y}`))
 
   return (
     <main className="page">
@@ -227,7 +231,20 @@ function App() {
             <PText size="small" weight="semi-bold">
               Next
             </PText>
-            <PTag>{nextType}</PTag>
+            <div className="preview" role="img" aria-label={`Next piece: ${nextType}`}>
+              {Array.from({ length: PREVIEW_ROWS * PREVIEW_COLS }, (_, i) => {
+                const x = i % PREVIEW_COLS
+                const y = Math.floor(i / PREVIEW_COLS)
+                const filled = nextCells.has(`${x},${y}`)
+                return (
+                  <div
+                    key={i}
+                    className="cell"
+                    style={{ background: filled ? COLORS[nextType] : undefined }}
+                  />
+                )
+              })}
+            </div>
           </div>
           {isRunning && !isGameOver && (
             <PButton variant="secondary" onClick={togglePause}>
diff --git a/app/src/tetris.ts b/app/src/tetris.ts
index a242461..86332ae 100644
--- a/app/src/tetris.ts
+++ b/app/src/tetris.ts
@@ -84,6 +84,21 @@ export function pieceCells(piece: Piece): [number, number][] {
   )
 }
 
+export const PREVIEW_COLS = 4
+export const PREVIEW_ROWS = 2
+
+/** Cells of a piece's spawn rotation, normalized and centered in a PREVIEW_COLS×PREVIEW_ROWS grid. */
+export function previewCells(type: PieceType): [number, number][] {
+  const cells = SHAPES[type][0]
+  const xs = cells.map(([x]) => x)
+  const ys = cells.map(([, y]) => y)
+  const minX = Math.min(...xs)
+  const minY = Math.min(...ys)
+  const offsetX = Math.floor((PREVIEW_COLS - (Math.max(...xs) - minX + 1)) / 2)
+  const offsetY = Math.floor((PREVIEW_ROWS - (Math.max(...ys) - minY + 1)) / 2)
+  return cells.map(([x, y]) => [x - minX + offsetX, y - minY + offsetY] as [number, number])
+}
+
 export function createEmptyBoard(): Board {
   return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
 }
```

---

## Транскрипт

_Сесія: Claude Code 2.1.325, модель `claude-opus-5-5`, permissionMode `acceptEdits`_

**Виклик:** `Bash`

```json
{
 "command": "cd app && cat src/tetris.ts && cat src/App.tsx && cat src/App.css",
 "description": "Read tetris logic, UI and styles"
}
```

**Результат:**

```
export const COLS = 10
export const ROWS = 20

export type Cell = string | null
export type Board = Cell[][]

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'

const SHAPES: Record<PieceType, number[][][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [1, 2], [0, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
}

export const COLORS: Record<PieceType, string> = {
  I: '#4dd2ff',
  J: '#4d6bff',
  L: '#ff9f4d',
  O: '#ffe14d',
  S: '#5cff4d',
  T: '#c04dff',
  Z: '#ff4d4d',
}

export const PIECE_TYPES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']

export type Piece = {
  type: PieceType
  rotation: number
  x: number
  y: number
}

export function randomPieceType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
}

export function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: 0, y: -1 }
}

export function pieceCells(piece: Piece): [number, number][] {
  return SHAPES[piece.type][piece.rotation].map(
    ([x, y]) => [x + piece.x, y + piece.y] as [number, number],
  )
}

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}

export function isValidPosition(board: Board, piece: Piece): boolean {
  return pieceCells(piece).every(([x, y]) => {
    if (x < 0 || x >= COLS || y >= ROWS) return false
    if (y < 0) return true
    return board[y][x] === null
  })
}

export function mergePiece(board: Board, piece: Piece): Board {
  const next = board.map((row) => [...row])
  for (const [x, y] of pieceCells(piece)) {
    if (y >= 0) next[y][x] = COLORS[piece.type]
  }
  return next
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === null))
  const cleared = ROWS - remaining.length
  const next = [
    ...Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null)),
    ...remaining,
  ]
  return { board: next, cleared }
}

export const SCORE_PER_LINES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}
import { useCallback, useEffect, useRef, useState } from 'react'
import { PButton, PHeading, PText, PTag } from '@porsche-design-system/components-react'
import {
  COLS,
  ROWS,
  COLORS,
  clearLines,
  createEmptyBoard,
  isValidPosition,
  mergePiece,
  pieceCells,
  randomPieceType,
  spawnPiece,
  SCORE_PER_LINES,
  type Board,
  type Piece,
} from './tetris'
import './App.css'

const TICK_MS = 700

function App() {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard())
  const [piece, setPiece] = useState<Piece>(() => spawnPiece(randomPieceType()))
  const [nextType, setNextType] = useState(() => randomPieceType())
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const boardRef = useRef(board)
  const pieceRef = useRef(piece)
  boardRef.current = board
  pieceRef.current = piece

  const spawnNext = useCallback(() => {
    const fresh = spawnPiece(nextType)
    setNextType(randomPieceType())
    if (!isValidPosition(boardRef.current, fresh)) {
      setIsGameOver(true)
      setIsRunning(false)
      return
    }
    setPiece(fresh)
  }, [nextType])

  const lockPiece = useCallback(() => {
    const merged = mergePiece(boardRef.current, pieceRef.current)
    const { board: cleared, cleared: clearedCount } = clearLines(merged)
    setBoard(cleared)
    if (clearedCount > 0) {
      setScore((s) => s + (SCORE_PER_LINES[clearedCount] ?? 0))
      setLines((l) => l + clearedCount)
    }
    spawnNext()
  }, [spawnNext])

  const tryMove = useCallback((dx: number, dy: number) => {
    setPiece((p) => {
      const moved = { ...p, x: p.x + dx, y: p.y + dy }
      return isValidPosition(boardRef.current, moved) ? moved : p
    })
  }, [])

  const softDrop = useCallback(() => {
    setPiece((p) => {
      const moved = { ...p, y: p.y + 1 }
      if (isValidPosition(boardRef.current, moved)) return moved
      queueMicrotask(lockPiece)
      return p
    })
  }, [lockPiece])

  const hardDrop = useCallback(() => {
    setPiece((p) => {
      let moved = p
      while (isValidPosition(boardRef.current, { ...moved, y: moved.y + 1 })) {
        moved = { ...moved, y: moved.y + 1 }
      }
      queueMicrotask(() => {
        setBoard((b) => {
          const merged = mergePiece(b, moved)
          const { board: cleared, cleared: clearedCount } = clearLines(merged)
          if (clearedCount > 0) {
            setScore((s) => s + (SCORE_PER_LINES[clearedCount] ?? 0))
            setLines((l) => l + clearedCount)
          }
          return cleared
        })
        spawnNext()
      })
      return moved
    })
  }, [spawnNext])

  const rotate = useCallback(() => {
    setPiece((p) => {
      const rotated = { ...p, rotation: (p.rotation + 1) % 4 }
      return isValidPosition(boardRef.current, rotated) ? rotated : p
    })
  }, [])

  const restart = useCallback(() => {
    setBoard(createEmptyBoard())
    setPiece(spawnPiece(randomPieceType()))
    setNextType(randomPieceType())
    setScore(0)
    setLines(0)
    setIsGameOver(false)
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p)
  }, [])

  useEffect(() => {
    if (!isRunning || isPaused) return
    const id = setInterval(softDrop, TICK_MS)
    return () => clearInterval(id)
  }, [isRunning, isPaused, softDrop])

  useEffect(() => {
    if (!isRunning) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        togglePause()
        return
      }
      if (isPaused) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          tryMove(-1, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          tryMove(1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          softDrop()
          break
        case 'ArrowUp':
          e.preventDefault()
          rotate()
          break
        case ' ':
          e.preventDefault()
          hardDrop()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isRunning, isPaused, tryMove, softDrop, rotate, hardDrop, togglePause])

  const activeCells = new Set(
    pieceCells(piece)
      .filter(([, y]) => y >= 0)
      .map(([x, y]) => `${x},${y}`),
  )
  const activeColor = COLORS[piece.type]

  return (
    <main className="page">
      <PHeading size="xx-large">Tetris</PHeading>

      <div className="layout">
        <div
          className="board"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
        >
          {board.map((row, y) =>
            row.map((cell, x) => {
              const isActive = activeCells.has(`${x},${y}`)
              const color = isActive ? activeColor : cell
              return (
                <div
                  key={`${x}-${y}`}
                  className="cell"
                  style={{ background: color ?? undefined }}
                />
              )
            }),
          )}

          {!isRunning && (
            <div className="overlay">
              {isGameOver ? (
                <>
                  <PHeading size="large">Game Over</PHeading>
                  <PText>Score: {score}</PText>
                </>
              ) : (
                <PHeading size="large">Tetris</PHeading>
              )}
              <PButton onClick={restart}>{isGameOver ? 'Play again' : 'Start'}</PButton>
            </div>
          )}

          {isRunning && isPaused && (
            <div className="overlay">
              <PHeading size="large">Paused</PHeading>
              <PButton onClick={togglePause}>Resume</PButton>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="panel">
            <PText size="small" weight="semi-bold">
              Score
            </PText>
            <PHeading size="large">{score}</PHeading>
          </div>
          <div className="panel">
            <PText size="small" weight="semi-bold">
              Lines
            </PText>
            <PHeading size="large">{lines}</PHeading>
          </div>
          <div className="panel">
            <PText size="small" weight="semi-bold">
              Next
            </PText>
            <PTag>{nextType}</PTag>
          </div>
          {isRunning && !isGameOver && (
            <PButton variant="secondary" onClick={togglePause}>
              {isPaused ? 'Resume' : 'Pause'}
            </PButton>
          )}
          <PButton variant="secondary" onClick={restart}>
            Restart
          </PButton>
          <PText size="x-small">
            Arrow keys to move/rotate, Space to hard drop, P to pause
          </PText>
        </aside>
      </div>
    </main>
  )
}

export default App
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-height: 100vh;
  padding: 32px;
}

.layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.board {
  position: relative;
  display: grid;
  gap: 1px;
  background: #1a1a1f;
  border: 4px solid #1a1a1f;
  border-radius: 4px;
  width: min(40vh, 300px);
  aspect-ratio: 1 / 2;
}

.cell {
  background: #2a2a32;
  border-radius: 2px;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(10, 10, 14, 0.85);
  border-radius: 4px;
  padding: 16px;
  text-align: center;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 160px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
}
```

**Виклик:** `Edit`

```json
{
 "replace_all": false,
 "file_path": "<tmp>/ws1-ab/run-b/app/src/tetris.ts",
 "old_string": "export function createEmptyBoard(): Board {",
 "new_string": "export const PREVIEW_COLS = 4\nexport const PREVIEW_ROWS = 2\n\n/** Cells of a piece's spawn rotation, normalized and centered in a PREVIEW_COLS×PREVIEW_ROWS grid. */\nexport function previewCells(type: PieceType): [number, number][] {\n  const cells = SHAPES[type][0]\n  const xs = cells.map(([x]) => x)\n  const ys = cells.map(([, y]) => y)\n  const minX = Math.min(...xs)\n  const minY = Math.min(...ys)\n  const offsetX = Math.floor((PREVIEW_COLS - (Math.max(...xs) - minX + 1)) / 2)\n  const offsetY = Math.floor((PREVIEW_ROWS - (Math.max(...ys) - minY + 1)) / 2)\n  return cells.map(([x, y]) => [x - minX + offsetX, y - minY + offsetY] as [number, number])\n}\n\nexport function createEmptyBoard(): Board {"
}
```

**Результат:**

```
The file <tmp>/ws1-ab/run-b/app/src/tetris.ts has been updated successfully.
```

**Виклик:** `Edit`

```json
{
 "replace_all": false,
 "file_path": "<tmp>/ws1-ab/run-b/app/src/App.tsx",
 "old_string": "            <PTag>{nextType}</PTag>",
 "new_string": "            <div className=\"preview\" role=\"img\" aria-label={`Next piece: ${nextType}`}>\n              {Array.from({ length: PREVIEW_ROWS * PREVIEW_COLS }, (_, i) => {\n                const x = i % PREVIEW_COLS\n                const y = Math.floor(i / PREVIEW_COLS)\n                const filled = nextCells.has(`${x},${y}`)\n                return (\n                  <div\n                    key={i}\n                    className=\"cell\"\n                    style={{ background: filled ? COLORS[nextType] : undefined }}\n                  />\n                )\n              })}\n            </div>"
}
```

**Результат:**

```
The file <tmp>/ws1-ab/run-b/app/src/App.tsx has been updated successfully.
```

**Виклик:** `Edit`

```json
{
 "replace_all": false,
 "file_path": "<tmp>/ws1-ab/run-b/app/src/App.tsx",
 "old_string": "  const activeColor = COLORS[piece.type]\n",
 "new_string": "  const activeColor = COLORS[piece.type]\n  const nextCells = new Set(previewCells(nextType).map(([x, y]) => `${x},${y}`))\n"
}
```

**Результат:**

```
The file <tmp>/ws1-ab/run-b/app/src/App.tsx has been updated successfully.
```

**Виклик:** `Edit`

```json
{
 "replace_all": false,
 "file_path": "<tmp>/ws1-ab/run-b/app/src/App.tsx",
 "old_string": "import { PButton, PHeading, PText, PTag } from '@porsche-design-system/components-react'\nimport {\n  COLS,\n  ROWS,\n  COLORS,",
 "new_string": "import { PButton, PHeading, PText } from '@porsche-design-system/components-react'\nimport {\n  COLS,\n  ROWS,\n  COLORS,\n  PREVIEW_COLS,\n  PREVIEW_ROWS,\n  previewCells,"
}
```

**Результат:**

```
The file <tmp>/ws1-ab/run-b/app/src/App.tsx has been updated successfully.
```

**Виклик:** `Bash`

```json
{
 "command": "cat >> src/App.css <<'EOF'\n\n.preview {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  grid-template-rows: repeat(2, 1fr);\n  gap: 1px;\n  background: #1a1a1f;\n  border: 4px solid #1a1a1f;\n  border-radius: 4px;\n  width: 100%;\n  aspect-ratio: 2 / 1;\n}\nEOF\nnpm run build 2>&1 | tail -20\nnpx tsx -e \"import {previewCells,PIECE_TYPES} from './src/tetris.ts'; for (const t of PIECE_TYPES){const s=previewCells(t); const g=[0,1].map(y=>[0,1,2,3].map(x=>s.some(([a,b])=>a===x&&b===y)?'#':'.').join('')); console.log(t, g.join(' | '))}\" 2>&1",
 "description": "Add preview styles, build, and print previews for all 7 pieces"
}
```

**Результат (is_error: true):**

```
This Bash command contains multiple operations. The following part requires approval: tail -20
npx tsx -e "import {previewCells,PIECE_TYPES} from './src/tetris.ts'; for (const t of PIECE_TYPES){const s=previewCells(t); const g=[0,1].map(y=>[0,1,2,3].map(x=>s.some(([a,b])=>a===x&&b===y)?'#':'.').join('')); console.log(t, g.join(' | '))}" 2>&1
```

**Виклик:** `Read`

```json
{
 "file_path": "<tmp>/ws1-ab/run-b/app/src/App.css",
 "offset": 55
}
```

**Результат:**

```
55	  flex-direction: column;
56	  gap: 4px;
57	  padding: 12px;
58	  border-radius: 8px;
59	  background: rgba(0, 0, 0, 0.05);
60	}
61	
```

**Виклик:** `Edit`

```json
{
 "replace_all": false,
 "file_path": "<tmp>/ws1-ab/run-b/app/src/App.css",
 "old_string": "  background: rgba(0, 0, 0, 0.05);\n}\n",
 "new_string": "  background: rgba(0, 0, 0, 0.05);\n}\n\n.preview {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  grid-template-rows: repeat(2, 1fr);\n  gap: 1px;\n  background: #1a1a1f;\n  border: 4px solid #1a1a1f;\n  border-radius: 4px;\n  width: 100%;\n  aspect-ratio: 2 / 1;\n}\n"
}
```

**Результат:**

```
The file <tmp>/ws1-ab/run-b/app/src/App.css has been updated successfully.
```

**Виклик:** `Bash`

```json
{
 "command": "npm run build",
 "description": "Build the app"
}
```

**Результат:**

```
> app@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 97 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-BEJm3WAc.css    2.67 kB │ gzip:  1.08 kB
dist/assets/index-C54fdqiy.js   228.45 kB │ gzip: 71.74 kB

✓ built in 374ms
```

**Агент:**

Панель «Next» тепер показує форму наступної фігури її кольором на міні-сітці 4×2. `npm run build` проходить. У браузері я це не відкривав. Форми всіх 7 фігур звірив вручну з `SHAPES`, тестів для цього немає.

**Змінені файли**

- **`app/src/tetris.ts`** — додано одну чисту функцію `previewCells(type)` і константи `PREVIEW_COLS = 4` та `PREVIEW_ROWS = 2`.
  - Функція бере стартовий поворот (`SHAPES[type][0]`) і зсуває фігуру до лівого верхнього кута.
  - Потім центрує її по горизонталі: O стоїть у колонках 1–2, I займає весь верхній рядок, 3-клітинні фігури — колонки 0–2.
  - Усі 7 фігур уміщаються в межах 4×2.
  - Ігрову логіку й наявні функції не змінено.
- **`app/src/App.tsx`** — `PTag` замінено на сітку з 8 клітинок класу `.cell`, тих самих, що й на дошці.
  - Заповнені клітинки мають колір `COLORS[nextType]`.
  - Сітка має `role="img"` і `aria-label="Next piece: <тип>"`.
  - Підпис «Next» лишився `PText`.
  - Імпорт `PTag`, який більше ніде не використовується, прибрано.
- **`app/src/App.css`** — додано клас `.preview` у стилі дошки: grid 4×2, пропорції 2:1, на всю ширину панелі.

**Вивід `cd app && npm run build`**
```
> app@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 97 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-BEJm3WAc.css    2.67 kB │ gzip:  1.08 kB
dist/assets/index-C54fdqiy.js   228.45 kB │ gzip: 71.74 kB

✓ built in 374ms
```

Зміни не закомічено.

_Кінець сесії: success, ходів 10_


## Session result (raw `result` line, selected fields)

```json
{
  "subtype": "success",
  "is_error": false,
  "num_turns": 10,
  "duration_ms": 41855,
  "duration_api_ms": 36470,
  "total_cost_usd": 0.3705780000000001,
  "usage": {
    "input_tokens": 10,
    "output_tokens": 3954,
    "cache_read_input_tokens": 219490,
    "cache_creation_input_tokens": 30945
  }
}
```
