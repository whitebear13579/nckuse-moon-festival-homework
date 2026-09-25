import { describe, expect, it } from 'vitest'
import { formatTime, fullMask, isLit, PUZZLES, toggleCell } from '@/lib/game'
import { visibleElapsed } from '@/lib/timer'

describe('燈陣規則', () => {
  it.each([3, 4, 5])('中心、邊角點擊只翻轉有效鄰格：%i×%i', size => {
    const cells = [0, size - 1, Math.floor(size * size / 2)]
    for (const cell of cells) {
      const mask = toggleCell(0, size, cell)
      const expected = [cell, cell - size, cell + size, cell - 1, cell + 1]
        .filter(index => index >= 0 && index < size * size)
        .filter(index => index === cell || Math.abs(Math.floor(index / size) - Math.floor(cell / size)) + Math.abs(index % size - cell % size) === 1)
      expect(Array.from({ length: size * size }, (_, index) => index).filter(index => isLit(mask, index))).toEqual(expected.sort((a, b) => a - b))
      expect(toggleCell(mask, size, cell)).toBe(0)
    }
  })

  it('三關固定題目均未全亮且可按規定擾動步驟還原', () => {
    const moves = [[0, 4], [0, 3, 5, 10], [0, 4, 6, 12, 18, 24]]
    for (const stage of [1, 2, 3] as const) {
      const { size, initialMask } = PUZZLES[stage]
      expect(initialMask).not.toBe(fullMask(size))
      expect(moves[stage - 1].reduce((mask, cell) => toggleCell(mask, size, cell), initialMask)).toBe(fullMask(size))
    }
  })

  it('拒絕越界與非整數點格', () => {
    expect(() => toggleCell(0, 3, -1)).toThrow(RangeError)
    expect(() => toggleCell(0, 3, 9)).toThrow(RangeError)
    expect(() => toggleCell(0, 3, 1.5)).toThrow(RangeError)
  })

  it('顯示計時依伺服器基準與本機收到時間，不受本機時區或時鐘起點影響', () => {
    expect(visibleElapsed('2026-09-24T00:00:00.000Z', '2026-09-24T00:00:05.000Z', 1000, 2250)).toBe(6250)
    expect(formatTime(6250)).toBe('00:06.25')
    expect(formatTime(-10)).toBe('00:00.00')
  })
})
