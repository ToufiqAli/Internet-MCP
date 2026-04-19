import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import textCleaner from '../utils/textCleaner.js';

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const CACHE_PREFIX = 'search:';
const MAX_CACHE_SIZE = 1024 * 1024; // 1MB

class CacheService {
  constructor() {
    this.enabled = true;
  }

  getCacheKey(query) {
    const normalized = textCleaner.normalizeQuery(query);
    const sanitized = textCleaner.sanitizeForCache(normalized);
    return `${CACHE_PREFIX}${sanitized}`;
  }

  async get(query) {
    try {
      if (!this.enabled) return null;

      const key = this.getCacheKey(query);
      const cached = await redis.get(key);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          logger.debug(`Cache hit for query: "${query.substring(0, 50)}..."`);
          return parsed;
        } catch (parseError) {
          logger.error('Cache parse error:', parseError);
          await redis.del(key);
          return null;
        }
      }

      return null;
    } catch (error) {
      logger.error('Cache get error:', error.message);
      return null;
    }
  }

  async set(query, data, ttl = CACHE_TTL) {
    try {
      if (!this.enabled) return false;

      const key = this.getCacheKey(query);
      const serialized = JSON.stringify(data);

      if (serialized.length > MAX_CACHE_SIZE) {
        logger.warn(`Cache value too large for query "${query.substring(0, 50)}..."`);
        return false;
      }

      await redis.setex(key, ttl, serialized);
      logger.debug(`Cached result for query: "${query.substring(0, 50)}..."`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error.message);
      return false;
    }
  }

  async delete(query) {
    try {
      const key = this.getCacheKey(query);
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error.message);
      return false;
    }
  }

  async clear() {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Cleared ${keys.length} cache entries`);
      }
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error.message);
      return false;
    }
  }

  async getStats() {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      return {
        totalCached: keys.length,
        prefix: CACHE_PREFIX
      };
    } catch (error) {
      logger.error('Cache stats error:', error.message);
      return { totalCached: 0, prefix: CACHE_PREFIX };
    }
  }

  async warmCache(query, data) {
    return this.set(query, data, CACHE_TTL);
  }

  disable() {
    this.enabled = false;
    logger.warn('Cache service disabled');
  }

  enable() {
    this.enabled = true;
    logger.info('Cache service enabled');
  }
}

export const cacheService = new CacheService();
export default cacheService;
