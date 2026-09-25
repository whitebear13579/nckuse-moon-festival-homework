import { describe, expect, it } from 'vitest'
import { validateNickname } from '@/lib/nickname'

describe('公開暱稱', () => {
  it('修剪並正規化合法名字，接受 2 與 12 字邊界', () => {
    expect(validateNickname('  月兔  ')).toEqual({ nickname: '月兔' })
    expect(validateNickname('A12345678901').error).toBeUndefined()
    expect(validateNickname('月兔-7A3F9C2D').error).toBeUndefined()
  })
  it.each(['A', 'A123456789012', '----', '月 兔', '兔🐇', '<b>兔</b>', '兔\n兔', 123])('拒絕不合法暱稱 %s', input => {
    expect(validateNickname(input).error).toBe('nickname_invalid')
  })
  it.each(['ADMIN', 'official', '官方', '客服'])('保留管理名稱 %s', input => {
    expect(validateNickname(input).error).toBe('nickname_reserved')
  })
})
