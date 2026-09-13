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
  }, [])

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(softDrop, TICK_MS)
    return () => clearInterval(id)
  }, [isRunning, softDrop])

  useEffect(() => {
    if (!isRunning) return
    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [isRunning, tryMove, softDrop, rotate, hardDrop])

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
          <PButton variant="secondary" onClick={restart}>
            Restart
          </PButton>
          <PText size="x-small">
            Arrow keys to move/rotate, Space to hard drop
          </PText>
        </aside>
      </div>
    </main>
  )
}

export default App
