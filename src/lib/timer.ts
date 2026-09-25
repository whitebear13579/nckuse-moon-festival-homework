export function visibleElapsed(startedAt: string, serverNow: string, receivedAt: number, localNow = Date.now()): number {
  const started = Date.parse(startedAt)
  const server = Date.parse(serverNow)
  if (!Number.isFinite(started) || !Number.isFinite(server)) return 0
  return Math.max(0, server - started + Math.max(0, localNow - receivedAt))
}
