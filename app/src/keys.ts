// Ігрові клавіші й інтерактивні елементи (повне рев'ю CodeRabbit 25.11).
// Space на кнопці — це натискання кнопки (PDS v4 активує кнопки пробілом), а не hard drop: такі події гра
// пропускає й не скасовує. Стрілки й P працюють і з фокусом на кнопці — Space тоді не потрібен грі.
const INTERACTIVE = new Set(['BUTTON', 'P-BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'])

type PathItem = { tagName?: string; getAttribute?: (name: string) => string | null }

/** Чи пройшла подія через інтерактивний елемент (через `composedPath()` — і всередині Shadow DOM PDS). */
export function fromInteractive(path: readonly PathItem[]): boolean {
  return path.some((el) => {
    const tag = el.tagName?.toUpperCase()
    return (tag !== undefined && INTERACTIVE.has(tag)) || el.getAttribute?.('role') === 'button'
  })
}

/** Чи обробляти клавішу як ігрову: Space з фокусом на кнопці лишається кнопці. */
export function isGameKey(key: string, path: readonly PathItem[]): boolean {
  return !(key === ' ' && fromInteractive(path))
}
