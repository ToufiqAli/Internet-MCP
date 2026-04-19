import cacheService from './cacheService.js';
import usageService from './usageService.js';
import tavilyService from './tavilyService.js';
import scrapingService from './scrapingService.js';
import logger from '../utils/logger.js';
import textCleaner from '../utils/textCleaner.js';

class SearchService {
  constructor() {
    this.fallbackEnabled = true;
  }

  async smartSearch(query, options = {}) {
    const normalizedQuery = textCleaner.normalizeQuery(query);
    
    if (!normalizedQuery) {
      return {
        success: false,
        source: 'none',
        data: [],
        error: 'Invalid or empty query'
      };
    }

    logger.info(`Smart search started for: "${normalizedQuery}"`);

    try {
      // STEP 1: Check cache
      const cachedResult = await cacheService.get(normalizedQuery);
      if (cachedResult) {
        logger.info('Cache hit - returning cached result');
        return {
          success: true,
          source: 'cache',
          data: cachedResult.data || cachedResult,
          cached: true,
          timestamp: cachedResult.timestamp || new Date().toISOString()
        };
      }

      // STEP 2: Check usage limits
      const canUseApi = await usageService.canMakeRequest();
      const tavilyConfigured = tavilyService.isConfigured();

      let searchResult = null;
      let source = 'none';

      // STEP 3: Try Tavily API if configured and within limits
      if (tavilyConfigured && canUseApi) {
        try {
          logger.info('Attempting Tavily API search...');
          const tavilyResult = await tavilyService.search(normalizedQuery, options);
          
          if (tavilyResult.success && tavilyResult.data.length > 0) {
            // Increment usage counter
            const usageStats = await usageService.incrementUsage();
            logger.info(`Tavily API call successful. Usage: ${usageStats.daily}/${usageStats.dailyLimit} daily, ${usageStats.monthly}/${usageStats.monthlyLimit} monthly`);
            
            searchResult = tavilyResult.data;
            source = 'tavily';
          }
        } catch (tavilyError) {
          logger.error('Tavily API failed:', tavilyError.message);
        }
      } else {
        if (!tavilyConfigured) {
          logger.warn('Tavily API not configured');
        }
        if (!canUseApi) {
          logger.warn('Usage limits reached - Tavily API skipped');
        }
      }

      // STEP 4: Fallback - Direct URL fetching if user provides URLs
      if (!searchResult && options.urls && options.urls.length > 0) {
        try {
          logger.info('Attempting direct URL fetching...');
          const fetchResult = await scrapingService.fetchUrls(options.urls);
          
          if (fetchResult.length > 0) {
            searchResult = fetchResult;
            source = 'direct_fetch';
          }
        } catch (fetchError) {
          logger.error('Direct URL fetching failed:', fetchError.message);
        }
      }

      // STEP 5: No results available
      if (!searchResult || searchResult.length === 0) {
        const usageStats = await usageService.getUsageStats();
        const errorMessage = !canUseApi 
          ? `Usage limits reached: ${usageStats.daily.used}/${usageStats.daily.limit} daily, ${usageStats.monthly.used}/${usageStats.monthly.limit} monthly`
          : 'No results found from available sources';

        return {
          success: false,
          source: 'none',
          data: [],
          error: errorMessage,
          usage: usageStats
        };
      }

      // STEP 6: Cache the result
      const resultData = {
        data: searchResult,
        timestamp: new Date().toISOString(),
        query: normalizedQuery
      };

      await cacheService.set(normalizedQuery, resultData);

      // STEP 7: Return response
      return {
        success: true,
        source,
        data: searchResult,
        cached: false,
        timestamp: resultData.timestamp
      };

    } catch (error) {
      logger.error('Smart search error:', error.message);
      return {
        success: false,
        source: 'none',
        data: [],
        error: error.message
      };
    }
  }

  async fetchUrlContent(url) {
    try {
      logger.info(`Fetching URL content: ${url}`);
      
      const result = await scrapingService.fetchUrl(url);
      
      if (result) {
        return {
          success: true,
          source: 'direct_fetch',
          data: [result]
        };
      }

      return {
        success: false,
        source: 'none',
        data: [],
        error: 'Failed to fetch URL content'
      };

    } catch (error) {
      logger.error('Fetch URL error:', error.message);
      return {
        success: false,
        source: 'none',
        data: [],
        error: error.message
      };
    }
  }

  async getHealth() {
    const tavilyHealth = await tavilyService.healthCheck();
    const scrapingHealth = await scrapingService.healthCheck();
    const cacheStats = await cacheService.getStats();
    const usageStats = await usageService.getUsageStats();

    return {
      tavily: tavilyHealth,
      scraping: scrapingHealth,
      cache: cacheStats,
      usage: usageStats,
      timestamp: new Date().toISOString()
    };
  }

  async clearCache() {
    return await cacheService.clear();
  }

  async getUsageStats() {
    return await usageService.getUsageStats();
  }

  async resetUsage(type = 'all') {
    switch (type) {
      case 'daily':
        return await usageService.resetDaily();
      case 'monthly':
        return await usageService.resetMonthly();
      case 'all':
      default:
        return await usageService.resetAll();
    }
  }
}

export const searchService = new SearchService();
export default searchService;
