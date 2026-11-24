// Run by scripts/mutation-check.mjs against the ORIGINAL tetris.ts (b2b1b5b) — expected to fail.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COLS, createEmptyBoard, mergePiece, pieceCells, spawnPiece } from './tetris.ts'

test('a new piece spawns horizontally centred', () => {
  const xs = pieceCells(spawnPiece('O')).map(([x]) => x)
  const left = Math.min(...xs), right = COLS - 1 - Math.max(...xs)
  assert.ok(Math.abs(left - right) <= 1, `left gap ${left}, right gap ${right}`)
})

test('locking a piece partly above the board does not silently drop cells', () => {
  const piece = { ...spawnPiece('J'), y: -1 } // J rotation 0 has a cell at y = -1
  const merged = mergePiece(createEmptyBoard(), piece)
  const placed = merged.flat().filter((c) => c !== null).length
  assert.equal(placed, 4, `only ${placed} of 4 cells landed on the board`)
})
