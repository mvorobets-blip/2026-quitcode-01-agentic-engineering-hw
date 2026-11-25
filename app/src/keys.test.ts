import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromInteractive, isGameKey } from './keys.ts'

const el = (tagName: string, role?: string) => ({ tagName, getAttribute: (n: string) => (n === 'role' ? role ?? null : null) })
const body = [el('BODY'), el('HTML')]

test('Space з фокусом на кнопці PDS (Shadow DOM: button → p-button) — не ігрова клавіша (рев\'ю 25.11)', () => {
  const path = [el('BUTTON'), el('P-BUTTON'), el('ASIDE'), ...body]
  assert.equal(fromInteractive(path), true)
  assert.equal(isGameKey(' ', path), false)
})

test('Space поза кнопками — hard drop, як і раніше', () => {
  assert.equal(isGameKey(' ', body), true)
})

test('стрілки й P з фокусом на кнопці лишаються ігровими', () => {
  const path = [el('BUTTON'), el('P-BUTTON'), ...body]
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'p']) assert.equal(isGameKey(key, path), true)
})

test('елемент з role="button" теж вважається кнопкою', () => {
  assert.equal(isGameKey(' ', [el('DIV', 'button'), ...body]), false)
})
