import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../Redis/redis.service';

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private _redisService: RedisService) {}

  /**
   * The cache-aside pattern: return the cached value if it exists,
   * otherwise call `fetcher` (your real DB query), cache its result, and
   * return it.
   *
   * Crucially: if Redis itself is unreachable, we log a warning and fall
   * straight through to `fetcher` rather than throwing. Caching should
   * make the app faster when it's available — it should never become a
   * new way for the app to go down. A slow app beats a broken one.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    try {
      const cached = await this._redisService.get(key);
      if (cached !== null) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      this.logger.warn(
        `Cache read failed for key "${key}", falling back to source: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const fresh = await fetcher();

    try {
      await this._redisService.set({
        key,
        value: JSON.stringify(fresh),
        exValue: ttlSeconds,
      });
    } catch (error) {
      this.logger.warn(
        `Cache write failed for key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return fresh;
  }

  /**
   * Invalidates a single key, or every key matching a glob pattern if
   * `keyOrPattern` contains a `*`. Call this the instant underlying data
   * changes (create/update/delete) — a cache with no invalidation is just
   * a slow-to-discover bug generator.
   */
  async invalidate(keyOrPattern: string) {
    if (keyOrPattern.includes('*')) {
      await this._redisService.removeByPattern(keyOrPattern);
    } else {
      await this._redisService.remove(keyOrPattern);
    }
  }
}
