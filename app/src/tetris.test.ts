// Rules of the game, tested without React. Run: `npm test` (built-in node:test, no dependencies).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  COLS,
  ROWS,
  clearLines,
  createEmptyBoard,
  hardDrop,
  moveBy,
  rotate,
  isValidPosition,
  lockPiece,
  newGame,
  pieceCells,
  softDrop,
  spawnPiece,
  type Board,
  type GameState,
  type PieceType,
} from './tetris.ts'

const filledRow = (except: number[] = []) =>
  Array.from({ length: COLS }, (_, x) => (except.includes(x) ? null : '#888'))

/** A board whose bottom rows are given; everything above is empty. */
function boardWithBottom(...rows: (string | null)[][]): Board {
  const board = createEmptyBoard()
  rows.forEach((row, i) => (board[ROWS - rows.length + i] = row))
  return board
}

const filledCells = (board: Board) => board.flat().filter((c) => c !== null).length

/** A fresh game with a chosen active piece and "Next" type (the rest comes from seed 1). */
const game = (piece: PieceType, next: PieceType): GameState => ({ ...newGame(1), piece: spawnPiece(piece), nextType: next })

// --- board rules -------------------------------------------------------------

test('isValidPosition: walls, floor and occupied cells block; space above the board does not', () => {
  const board = boardWithBottom(filledRow([0]))
  assert.equal(isValidPosition(board, { type: 'O', rotation: 0, x: -2, y: 0 }), false, 'left wall')
  assert.equal(isValidPosition(board, { type: 'O', rotation: 0, x: COLS - 2, y: 0 }), false, 'right wall')
  assert.equal(isValidPosition(board, { type: 'O', rotation: 0, x: 3, y: ROWS - 1 }), false, 'floor')
  assert.equal(isValidPosition(board, { type: 'O', rotation: 0, x: 3, y: ROWS - 2 }), false, 'occupied cell')
  assert.equal(isValidPosition(board, { type: 'O', rotation: 0, x: 3, y: -1 }), true, 'partly above the board')
})

test('clearLines removes every full row at once and adds empty rows on top', () => {
  const board = boardWithBottom(filledRow(), filledRow([4]), filledRow(), filledRow())
  const { board: next, cleared } = clearLines(board)
  assert.equal(cleared, 3)
  assert.equal(next.length, ROWS)
  assert.deepEqual(next[ROWS - 1], filledRow([4]), 'the incomplete row drops to the bottom')
  assert.ok(next.slice(0, ROWS - 1).every((row) => row.every((c) => c === null)))
})

test('a new piece spawns horizontally centred', () => {
  for (const type of ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as PieceType[]) {
    const xs = pieceCells(spawnPiece(type)).map(([x]) => x)
    const left = Math.min(...xs)
    const right = COLS - 1 - Math.max(...xs)
    assert.ok(Math.abs(left - right) <= 1, `${type}: left gap ${left}, right gap ${right}`)
  }
})

// --- one locking step: merge → clear → score → spawn ---------------------------

// O at x=3 covers columns 4–5 (its cells sit at box columns 1–2).
test('one cleared line scores 100 and counts 1 line — exactly once (review: Score 200 / Lines 2 in dev)', () => {
  const state: GameState = { ...game('O', 'T'), board: boardWithBottom(filledRow([4, 5])) }
  const after = hardDrop(state)
  assert.equal(after.lines, 1)
  assert.equal(after.score, 100)
  assert.equal(filledCells(after.board), 2, 'the upper half of the O stays, dropped to the bottom row')
})

test('two lines cleared by one piece score 300 (a double), not 2 × 100', () => {
  const state: GameState = { ...game('O', 'T'), board: boardWithBottom(filledRow([4, 5]), filledRow([4, 5])) }
  const after = hardDrop(state)
  assert.equal(after.lines, 2)
  assert.equal(after.score, 300)
  assert.equal(filledCells(after.board), 0)
})

test('lock-out: a piece that locks partly above the board ends the game, no cells cut off', () => {
  // The board is full up to row 1, so a freshly spawned O cannot move down.
  const rows = Array.from({ length: ROWS - 1 }, () => filledRow([0]))
  const board = boardWithBottom(...rows)
  const state: GameState = { ...game('O', 'O'), board, piece: { type: 'O', rotation: 0, x: 3, y: -1 } }
  // O at x=3,y=-1 occupies rows -1..0 → locks partly above the board → lock-out, not a silent cut.
  const after = softDrop(state)
  assert.equal(after.over, 'lock-out')
  assert.equal(filledCells(after.board), filledCells(board), 'nothing is merged or cut off')
})

test('block-out: game ends on the lock that leaves no room for the next piece', () => {
  // Rows 2..19 full (gap in column 9 so they never clear); the O locks in rows 0–1 at the spawn columns.
  const board = boardWithBottom(...Array.from({ length: ROWS - 2 }, () => filledRow([9])))
  const state: GameState = { ...game('O', 'T'), board, piece: { type: 'O', rotation: 0, x: 3, y: 0 } }
  const after = hardDrop(state)
  assert.equal(after.over, 'block-out', 'the T cannot spawn on the board that already has the O in it')
})

test('10 O pieces dropped in one column: the game ends on the 10th lock, not one piece later', () => {
  let state = game('O', 'O')
  let locks = 0
  while (!state.over && locks < 20) {
    state = hardDrop({ ...state, nextType: 'O' })
    locks++
  }
  assert.equal(locks, 10)
  assert.equal(state.over, 'block-out')
  assert.equal(filledCells(state.board), 40, 'all 10 O pieces are on the board, none drawn over another')
})

// --- purity: what React StrictMode relies on ----------------------------------

test('transitions are pure: same input twice → equal output, input untouched', () => {
  let state = newGame(7)
  for (let i = 0; i < 300 && !state.over; i++) {
    const before = structuredClone(state)
    const step = [hardDrop, softDrop, (s: GameState) => moveBy(s, i % 2 ? 1 : -1), rotate][i % 4]
    const a = step(state)
    const b = step(state)
    assert.deepEqual(a, b, `step ${i}: second call differs (StrictMode would double-count)`)
    assert.deepEqual(state, before, `step ${i}: input state was mutated`)
    state = a
  }
})

test('lockPiece after game over changes nothing', () => {
  const over: GameState = { ...game('O', 'O'), over: 'block-out' }
  assert.equal(lockPiece(over), over)
  assert.equal(hardDrop(over), over)
})

test('the same seed replays the same game', () => {
  const play = (seed: number) => {
    let s = newGame(seed)
    const types: PieceType[] = []
    for (let i = 0; i < 30 && !s.over; i++) {
      types.push(s.piece.type)
      s = hardDrop(s)
    }
    return { types, board: s.board, score: s.score }
  }
  assert.deepEqual(play(42), play(42))
  assert.notDeepEqual(play(42).types, play(43).types)
  assert.ok(new Set(play(42).types).size >= 5, 'the generator advances: a real mix of pieces, not one type forever')
})
