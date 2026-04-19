import redis from '../config/redis.js';
import logger from '../utils/logger.js';

const DAILY_LIMIT = 34;
const MONTHLY_LIMIT = 1000;
const DAILY_KEY_PREFIX = 'usage:daily:';
const MONTHLY_KEY_PREFIX = 'usage:monthly:';
const FIRST_USE_KEY = 'usage:first_use';

class UsageService {
  constructor() {
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || DAILY_LIMIT;
    this.monthlyLimit = parseInt(process.env.MONTHLY_LIMIT) || MONTHLY_LIMIT;
  }

  getCurrentDateKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async getDailyKey() {
    const dateKey = this.getCurrentDateKey();
    return `${DAILY_KEY_PREFIX}${dateKey}`;
  }

  async getMonthlyKey() {
    const monthKey = this.getCurrentMonthKey();
    return `${MONTHLY_KEY_PREFIX}${monthKey}`;
  }

  async getDailyUsage() {
    try {
      const key = await this.getDailyKey();
      const count = await redis.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      logger.error('Error getting daily usage:', error.message);
      return 0;
    }
  }

  async getMonthlyUsage() {
    try {
      const key = await this.getMonthlyKey();
      const count = await redis.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      logger.error('Error getting monthly usage:', error.message);
      return 0;
    }
  }

  async canMakeRequest() {
    try {
      const dailyUsage = await this.getDailyUsage();
      const monthlyUsage = await this.getMonthlyUsage();

      const canProceed = dailyUsage < this.dailyLimit && monthlyUsage < this.monthlyLimit;

      if (!canProceed) {
        if (dailyUsage >= this.dailyLimit) {
          logger.warn(`Daily limit reached: ${dailyUsage}/${this.dailyLimit}`);
        }
        if (monthlyUsage >= this.monthlyLimit) {
          logger.warn(`Monthly limit reached: ${monthlyUsage}/${this.monthlyLimit}`);
        }
      }

      return canProceed;
    } catch (error) {
      logger.error('Error checking usage limits:', error.message);
      return false;
    }
  }

  async incrementUsage() {
    try {
      const dailyKey = await this.getDailyKey();
      const monthlyKey = await this.getMonthlyKey();

      const dailyTtl = 25 * 60 * 60; // 25 hours (extra buffer)
      const monthlyTtl = 32 * 24 * 60 * 60; // 32 days (extra buffer)

      const dailyCount = await redis.incr(dailyKey);
      const monthlyCount = await redis.incr(monthlyKey);

      if (dailyCount === 1) {
        await redis.expire(dailyKey, dailyTtl);
      }
      if (monthlyCount === 1) {
        await redis.expire(monthlyKey, monthlyTtl);
      }

      await redis.set(FIRST_USE_KEY, Date.now().toString());

      logger.info(`Usage incremented - Daily: ${dailyCount}/${this.dailyLimit}, Monthly: ${monthlyCount}/${this.monthlyLimit}`);

      return {
        daily: dailyCount,
        monthly: monthlyCount,
        dailyRemaining: Math.max(0, this.dailyLimit - dailyCount),
        monthlyRemaining: Math.max(0, this.monthlyLimit - monthlyCount)
      };
    } catch (error) {
      logger.error('Error incrementing usage:', error.message);
      return { daily: 0, monthly: 0, dailyRemaining: 0, monthlyRemaining: 0 };
    }
  }

  async getUsageStats() {
    try {
      const dailyUsage = await this.getDailyUsage();
      const monthlyUsage = await this.getMonthlyUsage();
      const firstUse = await redis.get(FIRST_USE_KEY);

      return {
        daily: {
          used: dailyUsage,
          limit: this.dailyLimit,
          remaining: Math.max(0, this.dailyLimit - dailyUsage),
          percentage: Math.min(100, (dailyUsage / this.dailyLimit) * 100)
        },
        monthly: {
          used: monthlyUsage,
          limit: this.monthlyLimit,
          remaining: Math.max(0, this.monthlyLimit - monthlyUsage),
          percentage: Math.min(100, (monthlyUsage / this.monthlyLimit) * 100)
        },
        firstUse: firstUse ? new Date(parseInt(firstUse)).toISOString() : null
      };
    } catch (error) {
      logger.error('Error getting usage stats:', error.message);
      return {
        daily: { used: 0, limit: this.dailyLimit, remaining: this.dailyLimit, percentage: 0 },
        monthly: { used: 0, limit: this.monthlyLimit, remaining: this.monthlyLimit, percentage: 0 },
        firstUse: null
      };
    }
  }

  async resetDaily() {
    try {
      const key = await this.getDailyKey();
      await redis.del(key);
      logger.info('Daily usage reset manually');
      return true;
    } catch (error) {
      logger.error('Error resetting daily usage:', error.message);
      return false;
    }
  }

  async resetMonthly() {
    try {
      const keys = await redis.keys(`${MONTHLY_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      logger.info('Monthly usage reset manually');
      return true;
    } catch (error) {
      logger.error('Error resetting monthly usage:', error.message);
      return false;
    }
  }

  async resetAll() {
    try {
      const dailyKeys = await redis.keys(`${DAILY_KEY_PREFIX}*`);
      const monthlyKeys = await redis.keys(`${MONTHLY_KEY_PREFIX}*`);
      const allKeys = [...dailyKeys, ...monthlyKeys, FIRST_USE_KEY];
      
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
      }
      
      logger.info('All usage data reset manually');
      return true;
    } catch (error) {
      logger.error('Error resetting all usage:', error.message);
      return false;
    }
  }
}

export const usageService = new UsageService();
export default usageService;
