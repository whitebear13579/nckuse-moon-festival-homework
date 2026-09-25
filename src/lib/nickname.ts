const ALLOWED = /^[\u3400-\u4dbf\u4e00-\u9fffA-Za-z0-9_-]+$/u
const HAS_LETTER = /[\u3400-\u4dbf\u4e00-\u9fffA-Za-z]/u
const RESERVED = new Set(['admin', 'system', 'official', 'support', '官方', '管理員', '客服'])

export type NicknameError = 'nickname_invalid' | 'nickname_reserved'

export function normalizeNickname(input: string): string {
  return input.trim().normalize('NFC')
}

export function validateNickname(input: unknown): { nickname: string; error?: NicknameError } {
  if (typeof input !== 'string') return { nickname: '', error: 'nickname_invalid' }
  const nickname = normalizeNickname(input)
  const length = Array.from(nickname).length
  if (length < 2 || length > 12 || !ALLOWED.test(nickname) || !HAS_LETTER.test(nickname)) {
    return { nickname, error: 'nickname_invalid' }
  }
  if (RESERVED.has(nickname.toLowerCase())) return { nickname, error: 'nickname_reserved' }
  return { nickname }
}
