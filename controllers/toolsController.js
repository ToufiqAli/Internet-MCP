import searchService from '../services/searchService.js';
import logger from '../utils/logger.js';

export const smartSearch = async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string'
      });
    }

    if (query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Query exceeds maximum length of 500 characters'
      });
    }

    logger.info(`Smart search request from ${req.ip}: "${query.substring(0, 50)}..."`);

    const result = await searchService.smartSearch(query, options);

    if (!result.success) {
      return res.status(503).json({
        ...result,
        requestId: req.id
      });
    }

    return res.json({
      ...result,
      requestId: req.id
    });

  } catch (error) {
    logger.error('Smart search controller error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

export const fetchUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required and must be a string'
      });
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    logger.info(`Fetch URL request from ${req.ip}: ${url}`);

    const result = await searchService.fetchUrlContent(url);

    if (!result.success) {
      return res.status(404).json({
        ...result,
        requestId: req.id
      });
    }

    return res.json({
      ...result,
      requestId: req.id
    });

  } catch (error) {
    logger.error('Fetch URL controller error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

export const getHealth = async (req, res) => {
  try {
    const health = await searchService.getHealth();
    const overallStatus = health.tavily.status === 'healthy' || health.scraping.status === 'healthy'
      ? 'healthy'
      : 'degraded';

    return res.json({
      status: overallStatus,
      ...health,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requestId: req.id
    });
  } catch (error) {
    logger.error('Health check error:', error.message);
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};

export const getUsageStats = async (req, res) => {
  try {
    const stats = await searchService.getUsageStats();
    return res.json({
      success: true,
      ...stats,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Usage stats error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const clearCache = async (req, res) => {
  try {
    const result = await searchService.clearCache();
    return res.json({
      success: result,
      message: result ? 'Cache cleared successfully' : 'Failed to clear cache',
      requestId: req.id
    });
  } catch (error) {
    logger.error('Clear cache error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const resetUsage = async (req, res) => {
  try {
    const { type = 'all' } = req.body;
    
    if (!['daily', 'monthly', 'all'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset type. Use: daily, monthly, or all'
      });
    }

    const result = await searchService.resetUsage(type);
    return res.json({
      success: result,
      message: `Usage (${type}) reset ${result ? 'successfully' : 'failed'}`,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Reset usage error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
