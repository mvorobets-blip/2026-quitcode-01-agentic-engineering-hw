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
