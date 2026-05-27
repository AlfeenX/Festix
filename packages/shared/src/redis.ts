import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function acquireLock(
  key: string,
  owner: string,
  ttlSeconds: number
): Promise<boolean> {
  const r = getRedis();
  const result = await r.set(key, owner, 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function releaseLock(key: string, owner: string): Promise<boolean> {
  const r = getRedis();
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  const result = await r.eval(script, 1, key, owner);
  return result === 1;
}

export const RedisKeys = {
  seatLock: (seatId: string) => `seat:${seatId}:locked`,
  eventStock: (eventId: string) => `event:${eventId}:stock`,
  eventCache: (eventId: string) => `event:${eventId}:detail`,
  eventsList: () => 'events:published:list',
  rateLimit: (ip: string, route: string) => `ratelimit:${ip}:${route}`,
  waitingRoom: (eventId: string) => `queue:${eventId}:waiting`,
  activeUsers: (eventId: string) => `queue:${eventId}:active_users`,
  session: (userId: string) => `session:${userId}`,
};
