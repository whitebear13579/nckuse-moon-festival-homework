export function shouldReduceMotion(system: boolean, cloud: boolean | null): boolean {
  return system || cloud === true || cloud === null
}

export function isPreferenceUpdate(value: unknown): value is { reduceMotion: boolean; expectedRevision: number } {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return typeof data.reduceMotion === 'boolean' && Number.isInteger(data.expectedRevision) && Number(data.expectedRevision) >= 0
}
