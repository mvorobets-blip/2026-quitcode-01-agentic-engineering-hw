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

/** Every shape sits in a 4×4 box, so the box is centred: x = 3 on a 10-wide board. */
export const SPAWN_X = Math.floor((COLS - 4) / 2)

export function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: SPAWN_X, y: -1 }
}

/** Cells of a piece in its spawn rotation, relative to its 4×4 box — for the "Next" preview. */
export function shapeCells(type: PieceType): [number, number][] {
  return SHAPES[type][0].map(([x, y]) => [x, y] as [number, number])
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

/** True when any cell of the piece is above the visible board (lock-out if it locks there). */
export function isAboveBoard(piece: Piece): boolean {
  return pieceCells(piece).some(([, y]) => y < 0)
}

/**
 * Writes the piece into a copy of the board. Cells above the board cannot be stored, so the
 * caller must check `isAboveBoard` first — `lockPiece` does and ends the game instead.
 */
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

// ---------------------------------------------------------------------------
// Game state transitions. All pure: same input → same output, nothing mutated.
// The piece generator's state (`rng`) lives inside GameState, so even the random part is
// deterministic: React StrictMode may call the reducer twice in development and gets the
// same result, and the same seed always replays the same game.
// ---------------------------------------------------------------------------

/** One step of mulberry32: returns the next piece type and the new generator state. */
export function drawPiece(rng: number): [PieceType, number] {
  const a = (rng + 0x6d2b79f5) >>> 0
  let t = a
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [PIECE_TYPES[Math.floor(r * PIECE_TYPES.length)], a]
}

export type GameState = {
  board: Board
  piece: Piece
  nextType: PieceType
  score: number
  lines: number
  /** `null` while playing; why the game ended otherwise. */
  over: null | 'lock-out' | 'block-out'
  /** Piece generator state (see `drawPiece`). */
  rng: number
}

export function newGame(seed: number): GameState {
  const [first, rng1] = drawPiece(seed >>> 0)
  const [next, rng] = drawPiece(rng1)
  return { board: createEmptyBoard(), piece: spawnPiece(first), nextType: next, score: 0, lines: 0, over: null, rng }
}

/** Moves or rotates the active piece if the result is valid; otherwise returns the same state. */
export function tryPlace(state: GameState, piece: Piece): GameState {
  if (state.over || !isValidPosition(state.board, piece)) return state
  return { ...state, piece }
}

export function moveBy(state: GameState, dx: number): GameState {
  return tryPlace(state, { ...state.piece, x: state.piece.x + dx })
}

export function rotate(state: GameState): GameState {
  return tryPlace(state, { ...state.piece, rotation: (state.piece.rotation + 1) % 4 })
}

/**
 * Fixes the active piece in one step: merge → clear lines → score → spawn the next piece.
 * - lock-out: the piece locked with a cell above the board → game over, nothing is cut off;
 * - block-out: the next piece does not fit at its spawn position on the *new* board → game over.
 */
export function lockPiece(state: GameState): GameState {
  if (state.over) return state
  if (isAboveBoard(state.piece)) return { ...state, over: 'lock-out' }
  const merged = mergePiece(state.board, state.piece)
  const { board, cleared } = clearLines(merged)
  const fresh = spawnPiece(state.nextType)
  const [incoming, rng] = drawPiece(state.rng)
  return {
    board,
    piece: fresh,
    nextType: incoming,
    score: state.score + (SCORE_PER_LINES[cleared] ?? 0),
    lines: state.lines + cleared,
    over: isValidPosition(board, fresh) ? null : 'block-out',
    rng,
  }
}

/** One row down; if the piece cannot move, it locks. Used by gravity and the ↓ key. */
export function softDrop(state: GameState): GameState {
  if (state.over) return state
  const moved = { ...state.piece, y: state.piece.y + 1 }
  return isValidPosition(state.board, moved) ? { ...state, piece: moved } : lockPiece(state)
}

/** Drops the piece as far as it goes and locks it in the same step. */
export function hardDrop(state: GameState): GameState {
  if (state.over) return state
  let piece = state.piece
  while (isValidPosition(state.board, { ...piece, y: piece.y + 1 })) piece = { ...piece, y: piece.y + 1 }
  return lockPiece({ ...state, piece })
}
