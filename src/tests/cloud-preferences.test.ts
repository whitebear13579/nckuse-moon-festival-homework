import { describe, expect, it } from 'vitest'
import { isPreferenceUpdate, shouldReduceMotion } from '@/lib/cloud-preferences'

describe('雲端動畫偏好', () => {
  it('雲端值或系統值任一要求減少動畫便生效；未載入先避免動畫', () => {
    expect(shouldReduceMotion(false, false)).toBe(false)
    expect(shouldReduceMotion(false, true)).toBe(true)
    expect(shouldReduceMotion(true, false)).toBe(true)
    expect(shouldReduceMotion(false, null)).toBe(true)
  })
  it('僅接受布林值及非負整數 revision', () => {
    expect(isPreferenceUpdate({ reduceMotion: true, expectedRevision: 0 })).toBe(true)
    expect(isPreferenceUpdate({ reduceMotion: 'true', expectedRevision: 0 })).toBe(false)
    expect(isPreferenceUpdate({ reduceMotion: false, expectedRevision: -1 })).toBe(false)
    expect(isPreferenceUpdate({ reduceMotion: false, expectedRevision: 1.5 })).toBe(false)
  })
})
