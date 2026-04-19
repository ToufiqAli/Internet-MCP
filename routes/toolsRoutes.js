import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  smartSearch,
  fetchUrl,
  getHealth,
  getUsageStats,
  clearCache,
  resetUsage
} from '../controllers/toolsController.js';

const router = express.Router();

// Rate limiting for smart_search
const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many admin requests, please try again later'
  }
});

// POST /tools/smart_search - Main smart search endpoint
router.post('/smart_search', searchRateLimit, smartSearch);

// POST /tools/fetch_url - Direct URL content fetching
router.post('/fetch_url', searchRateLimit, fetchUrl);

// GET /tools/health - Health check endpoint
router.get('/health', getHealth);

// GET /tools/usage - Get usage statistics
router.get('/usage', adminRateLimit, getUsageStats);

// POST /tools/clear_cache - Clear all cached results (admin only)
router.post('/clear_cache', adminRateLimit, clearCache);


// POST /tools/reset_usage - Reset usage counters (admin only)
router.post('/reset_usage', adminRateLimit, resetUsage);

export default router;
