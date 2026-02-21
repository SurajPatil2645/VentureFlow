/**
 * Rate Limiter with Token Bucket Algorithm
 * Tracks requests per user/IP and enforces rate limits
 */

type RateLimitEntry = {
  tokens: number
  lastRefillTime: number
}

declare global {
  // eslint-disable-next-line no-var
  var __vc_rate_limiters: Map<string, RateLimitEntry> | undefined
}

const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10')
const TOKEN_REFILL_RATE = RATE_LIMIT_PER_MINUTE / 60 // tokens per second
const MAX_TOKENS = RATE_LIMIT_PER_MINUTE

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

/**
 * Check if a request is allowed under rate limit
 * Uses token bucket algorithm for smooth rate limiting
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const limiters = (globalThis.__vc_rate_limiters ??= new Map())
  const now = Date.now()

  let entry = limiters.get(identifier)

  if (!entry) {
    // First request from this identifier
    entry = {
      tokens: MAX_TOKENS - 1,
      lastRefillTime: now,
    }
    limiters.set(identifier, entry)
    return {
      allowed: true,
      remaining: MAX_TOKENS - 1,
    }
  }

  // Refill tokens based on time passed
  const timePassed = (now - entry.lastRefillTime) / 1000 // Convert to seconds
  const tokensToAdd = timePassed * TOKEN_REFILL_RATE
  entry.tokens = Math.min(MAX_TOKENS, entry.tokens + tokensToAdd)
  entry.lastRefillTime = now

  // Check if we have tokens available
  if (entry.tokens >= 1) {
    entry.tokens -= 1
    limiters.set(identifier, entry)
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
    }
  }

  // Calculate when the next token will be available
  const retryAfter = Math.ceil((1 - entry.tokens) / TOKEN_REFILL_RATE)

  return {
    allowed: false,
    remaining: 0,
    retryAfter,
  }
}

/**
 * Get current rate limit status for monitoring
 */
export function getRateLimitStatus(identifier: string): RateLimitResult {
  const limiters = globalThis.__vc_rate_limiters ?? new Map()
  const entry = limiters.get(identifier)

  if (!entry) {
    return {
      allowed: true,
      remaining: MAX_TOKENS,
    }
  }

  const now = Date.now()
  const timePassed = (now - entry.lastRefillTime) / 1000
  const tokensToAdd = timePassed * TOKEN_REFILL_RATE
  const currentTokens = Math.min(MAX_TOKENS, entry.tokens + tokensToAdd)

  return {
    allowed: currentTokens >= 1,
    remaining: Math.floor(currentTokens),
  }
}

/**
 * Reset rate limit for an identifier (admin use)
 */
export function resetRateLimit(identifier: string): void {
  const limiters = globalThis.__vc_rate_limiters ?? new Map()
  limiters.delete(identifier)
}

/**
 * Get rate limit configuration
 */
export function getRateLimitConfig() {
  return {
    requestsPerMinute: RATE_LIMIT_PER_MINUTE,
    tokenRefillRate: TOKEN_REFILL_RATE,
    maxTokens: MAX_TOKENS,
  }
}
