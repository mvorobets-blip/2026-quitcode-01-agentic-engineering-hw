import { useCallback, useEffect, useReducer } from 'react'
import { PButton, PHeading, PText } from '@porsche-design-system/components-react'
import {
  COLS,
  ROWS,
  COLORS,
  hardDrop,
  moveBy,
  newGame,
  pieceCells,
  rotate,
  shapeCells,
  softDrop,
  type GameState,
  type PieceType,
} from './tetris'
import './App.css'

const TICK_MS = 700

type Status = 'idle' | 'running' | 'paused'
type State = { game: GameState; status: Status }

// The reducer is pure: the piece generator lives in GameState and the seed comes in the
// 'start' action, so React StrictMode may call it twice and gets the same result.
type Action =
  | { type: 'start'; seed: number }
  | { type: 'move'; dx: number }
  | { type: 'rotate' }
  | { type: 'soft-drop' }
  | { type: 'hard-drop' }
  | { type: 'toggle-pause' }

function reducer(state: State, action: Action): State {
  if (action.type === 'start') return { game: newGame(action.seed), status: 'running' }
  if (action.type === 'toggle-pause') {
    if (state.status === 'idle' || state.game.over) return state
    return { ...state, status: state.status === 'paused' ? 'running' : 'paused' }
  }
  if (state.status !== 'running' || state.game.over) return state
  switch (action.type) {
    case 'move':
      return { ...state, game: moveBy(state.game, action.dx) }
    case 'rotate':
      return { ...state, game: rotate(state.game) }
    case 'soft-drop':
      return { ...state, game: softDrop(state.game) }
    case 'hard-drop':
      return { ...state, game: hardDrop(state.game) }
  }
}

/** `?seed=123` replays the same game (same pieces in the same order); otherwise a random seed. */
function pickSeed(): number {
  const fromUrl = Number(new URLSearchParams(window.location.search).get('seed'))
  return Number.isInteger(fromUrl) && fromUrl > 0 ? fromUrl : crypto.getRandomValues(new Uint32Array(1))[0]
}

function NextPreview({ type }: { type: PieceType }) {
  const cells = new Set(shapeCells(type).map(([x, y]) => `${x},${y}`))
  return (
    <div className="preview" aria-label={`Next piece: ${type}`} role="img">
      {Array.from({ length: 8 }, (_, i) => {
        const x = i % 4
        const y = Math.floor(i / 4)
        return (
          <div
            key={i}
            className="cell"
            style={{ background: cells.has(`${x},${y}`) ? COLORS[type] : undefined }}
          />
        )
      })}
    </div>
  )
}

function App() {
  const [{ game, status }, dispatch] = useReducer(reducer, undefined, () => ({
    game: newGame(1), // placeholder behind the Start overlay; Start picks the real seed
    status: 'idle' as Status,
  }))
  const isOver = game.over !== null
  const isPlaying = status === 'running' && !isOver

  const start = useCallback(() => {
    // Drop focus from the Start/Restart button, or Enter would restart the game mid-play.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    dispatch({ type: 'start', seed: pickSeed() })
  }, [])
  const togglePause = useCallback(() => dispatch({ type: 'toggle-pause' }), [])

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => dispatch({ type: 'soft-drop' }), TICK_MS)
    return () => clearInterval(id)
  }, [isPlaying])

  useEffect(() => {
    if (status === 'idle' || isOver) return
    const onKeyDown = (e: KeyboardEvent) => {
      const keys: Record<string, () => void> = {
        p: togglePause,
        P: togglePause,
        ArrowLeft: () => dispatch({ type: 'move', dx: -1 }),
        ArrowRight: () => dispatch({ type: 'move', dx: 1 }),
        ArrowUp: () => dispatch({ type: 'rotate' }),
        ArrowDown: () => dispatch({ type: 'soft-drop' }),
        ' ': () => dispatch({ type: 'hard-drop' }),
      }
      const handler = keys[e.key]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [status, isOver, togglePause])

  const activeCells = new Set(
    status === 'idle' || isOver
      ? []
      : pieceCells(game.piece)
          .filter(([, y]) => y >= 0)
          .map(([x, y]) => `${x},${y}`),
  )

  return (
    <main className="page">
      <PHeading size="xx-large">Tetris</PHeading>

      <div className="layout">
        <div
          className="board"
          data-testid="board"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
        >
          {game.board.map((row, y) =>
            row.map((cell, x) => {
              const color = activeCells.has(`${x},${y}`) ? COLORS[game.piece.type] : cell
              return <div key={`${x}-${y}`} className="cell" style={{ background: color ?? undefined }} />
            }),
          )}

          {(status === 'idle' || isOver) && (
            <div className="overlay">
              {isOver ? (
                <>
                  <PHeading size="large">Game Over</PHeading>
                  <PText>Score: {game.score}</PText>
                </>
              ) : (
                <PHeading size="large">Tetris</PHeading>
              )}
              <PButton onClick={start}>{isOver ? 'Play again' : 'Start'}</PButton>
            </div>
          )}

          {status === 'paused' && !isOver && (
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
            <PHeading size="large" data-testid="score">
              {game.score}
            </PHeading>
          </div>
          <div className="panel">
            <PText size="small" weight="semi-bold">
              Lines
            </PText>
            <PHeading size="large" data-testid="lines">
              {game.lines}
            </PHeading>
          </div>
          <div className="panel">
            <PText size="small" weight="semi-bold">
              Next
            </PText>
            <NextPreview type={game.nextType} />
          </div>
          {status !== 'idle' && !isOver && (
            <PButton variant="secondary" onClick={togglePause}>
              {status === 'paused' ? 'Resume' : 'Pause'}
            </PButton>
          )}
          <PButton variant="secondary" onClick={start}>
            Restart
          </PButton>
          <PText size="x-small">Arrow keys to move/rotate, Space to hard drop, P to pause</PText>
        </aside>
      </div>
    </main>
  )
}

export default App
