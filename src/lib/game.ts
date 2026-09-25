export const PUZZLE_VERSION = 1
export const STAGES = [1, 2, 3] as const
export type Stage = (typeof STAGES)[number]

export const PUZZLES: Record<Stage, { size: number; initialMask: number }> = {
  1: { size: 3, initialMask: 334 },
  2: { size: 4, initialMask: 45906 },
  3: { size: 5, initialMask: 16510374 },
}

export function isStage(value: unknown): value is Stage {
  return value === 1 || value === 2 || value === 3
}

export function fullMask(size: number): number {
  return (1 << (size * size)) - 1
}

export function toggleCell(mask: number, size: number, cell: number): number {
  if (!Number.isInteger(cell) || cell < 0 || cell >= size * size) throw new RangeError('cellIndex')
  const row = Math.floor(cell / size)
  const col = cell % size
  const cells = [cell]
  if (row > 0) cells.push(cell - size)
  if (row < size - 1) cells.push(cell + size)
  if (col > 0) cells.push(cell - 1)
  if (col < size - 1) cells.push(cell + 1)
  return cells.reduce((next, index) => next ^ (1 << index), mask)
}

export function isLit(mask: number, cell: number): boolean {
  return Boolean(mask & (1 << cell))
}

export function litCount(mask: number, size: number): number {
  let count = 0
  for (let index = 0; index < size * size; index++) if (isLit(mask, index)) count++
  return count
}

export function formatTime(ms: number): string {
  const centiseconds = Math.max(0, Math.floor(ms / 10))
  const minutes = Math.floor(centiseconds / 6000)
  const seconds = Math.floor((centiseconds % 6000) / 100)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}`
}
