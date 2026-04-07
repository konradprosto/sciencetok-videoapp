import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// Noop ratelimiter when Redis is not configured
const noopLimit = { limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }) }

// 10 requests per 10 seconds for general API
export const ratelimit = hasRedis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 s'), analytics: true })
  : noopLimit

// 3 uploads per minute
export const uploadRatelimit = hasRedis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1 m'), analytics: true })
  : noopLimit

// 20 comments per minute
export const commentRatelimit = hasRedis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), analytics: true })
  : noopLimit
