// Shows that the tests in src/tetris.test.ts are meaningful.
//   0. Red baseline: scripts/baseline-original.test.ts against the ORIGINAL tetris.ts (commit b2b1b5b)
//      must fail. (src/tetris.test.ts itself cannot run there: newGame/lockPiece did not exist.)
//   1–7. Each known bug is put back into a temp copy of src/tetris.ts; the real test file must fail.
// Run from app/: `npm run test:mutants`. Nothing in src/ is changed.
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SRC = readFileSync('src/tetris.ts', 'utf8')

const MUTANTS = [
  ['spawn at the left wall (x = 0)', 'x: SPAWN_X, y: -1', 'x: 0, y: -1'],
  ['no lock-out: cells above the board are cut off', "if (isAboveBoard(state.piece)) return { ...state, over: 'lock-out' }", ''],
  ['block-out checked against the OLD board (late game over)', 'isValidPosition(board, fresh)', 'isValidPosition(state.board, fresh)'],
  [
    'cleared line counted twice (the StrictMode bug)',
    'lines: state.lines + cleared,',
    'lines: state.lines + 2 * cleared,',
  ],
  ['mergePiece mutates the board in place', 'const next = board.map((row) => [...row])', 'const next = board'],
  [
    'softDrop mutates the piece in place',
    'const moved = { ...state.piece, y: state.piece.y + 1 }',
    'const moved = Object.assign(state.piece, { y: state.piece.y + 1 })',
  ],
  [
    'piece generator not advanced (same piece forever)',
    'const [incoming, rng] = drawPiece(state.rng)',
    'const [incoming] = drawPiece(state.rng); const rng = state.rng',
  ],
]

function runTests(dir, testFile) {
  // Explicit spec reporter: with piped stdout Node 22 defaults to TAP, which the parser below does not read.
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', join(dir, testFile)], { encoding: 'utf8' })
  const count = (k) => Number((r.stdout.match(new RegExp(`^ℹ ${k} (\\d+)`, 'm')) ?? [])[1] ?? NaN)
  return { pass: count('pass'), fail: count('fail') }
}

function inTemp(tetrisSource, testSrcPath, testName) {
  const dir = mkdtempSync(join(tmpdir(), 'tetris-mutant-'))
  try {
    writeFileSync(join(dir, 'tetris.ts'), tetrisSource)
    copyFileSync(testSrcPath, join(dir, testName))
    return runTests(dir, testName)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

let ok = true
// Базова ревізія потрібна в історії: у неглибокому клоні (--depth) чи архіві її немає — тоді зрозуміла помилка,
// а не стек execFileSync (повне рев'ю CodeRabbit 25.11).
let original
try {
  original = execFileSync('git', ['show', 'b2b1b5b:app/src/tetris.ts'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
} catch {
  console.error('mutation-check: commit b2b1b5b (the submitted code) is not in this clone. Run `git fetch --unshallow` (or clone without --depth) and try again.')
  process.exit(2)
}
const base = inTemp(original, 'scripts/baseline-original.test.ts', 'baseline.test.ts')
console.log(`0. original code (b2b1b5b), baseline tests: ${base.fail} failed, ${base.pass} passed → ${base.fail > 0 ? 'RED as expected' : 'NOT RED'}`)
ok &&= base.fail > 0

const clean = inTemp(SRC, 'src/tetris.test.ts', 'tetris.test.ts')
console.log(`   fixed code, real tests: ${clean.fail} failed, ${clean.pass} passed`)
ok &&= clean.fail === 0

MUTANTS.forEach(([name, from, to], i) => {
  if (!SRC.includes(from)) throw new Error(`mutant ${i + 1}: pattern not found: ${from}`)
  const r = inTemp(SRC.replace(from, to), 'src/tetris.test.ts', 'tetris.test.ts')
  console.log(`${i + 1}. ${name}: ${r.fail} test(s) failed → ${r.fail > 0 ? 'caught' : 'SURVIVED'}`)
  ok &&= r.fail > 0
})

console.log(ok ? 'OK: baseline red, fixed code green, every mutant caught.' : 'PROBLEM: see above.')
process.exit(ok ? 0 : 1)
