export function getCreditsAvailablePercent(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.round(((total - used) / total) * 100))
}

export function getCreditsUsedPercent(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

/** Green at 0% used → red at 100% used */
export function getCreditsBarColor(usedPct: number): string {
  const clamped = Math.max(0, Math.min(100, usedPct))
  const hue = Math.round((1 - clamped / 100) * 142)
  return `hsl(${hue}, 58%, 42%)`
}

export function formatLimitResetIn(resetAt: string, now = Date.now()): string {
  const ms = new Date(resetAt).getTime() - now
  if (ms <= 0) return 'Limit resets soon'

  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)

  if (hours >= 1 && minutes > 0) {
    return `Limit resets in ${hours}h ${minutes}m`
  }
  if (hours >= 1) {
    return hours === 1 ? 'Limit resets in 1 hour' : `Limit resets in ${hours} hours`
  }
  if (minutes <= 1) return 'Limit resets in 1 minute'
  return `Limit resets in ${minutes} minutes`
}
