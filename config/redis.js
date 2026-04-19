import Redis from 'ioredis';
import logger from '../utils/logger.js';

const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const client = new Redis(redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
    family: 4,
    lazyConnect: true
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (err) => {
    logger.error('Redis error:', err.message);
  });

  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });

  client.on('end', () => {
    logger.warn('Redis connection ended');
  });

  return client;
};

const redis = createRedisClient();

export const getRedisStatus = async () => {
  try {
    await redis.ping();
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

export default redis;
