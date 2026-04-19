import axios from 'axios';
import logger from '../utils/logger.js';

const TAVILY_API_URL = 'https://api.tavily.com/search';
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 15000;
const MAX_RESULTS = 5;

class TavilyService {
  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
    this.retryDelay = 1000;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async search(query, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Tavily API key not configured');
    }

    const searchOptions = {
      query,
      search_depth: options.searchDepth || 'basic',
      max_results: options.maxResults || MAX_RESULTS,
      include_answer: options.includeAnswer || false,
      include_domains: options.includeDomains || [],
      exclude_domains: options.excludeDomains || []
    };

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(`Tavily API search attempt ${attempt}/${MAX_RETRIES} for query: "${query.substring(0, 50)}..."`);

        const response = await axios.post(
          TAVILY_API_URL,
          searchOptions,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': this.apiKey
            },
            timeout: REQUEST_TIMEOUT,
            validateStatus: (status) => status === 200
          }
        );

        if (!response.data) {
          throw new Error('Empty response from Tavily API');
        }

        const { results, answer, query: returnedQuery } = response.data;

        if (!results || results.length === 0) {
          logger.warn('No results from Tavily API');
          return {
            success: true,
            data: [],
            answer: answer || null,
            source: 'tavily'
          };
        }

        const formattedResults = results.map(result => ({
          title: result.title || 'No title',
          url: result.url || '',
          snippet: result.content || result.snippet || result.description || '',
          score: result.score || 0
        }));

        logger.info(`Tavily API returned ${formattedResults.length} results`);

        return {
          success: true,
          data: formattedResults,
          answer: answer || null,
          source: 'tavily',
          query: returnedQuery || query
        };

      } catch (error) {
        lastError = error;
        logger.error(`Tavily API attempt ${attempt} failed:`, error.message);

        if (attempt === MAX_RETRIES) {
          break;
        }

        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        logger.info(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    const errorMessage = this.formatError(lastError);
    throw new Error(`Tavily API failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
  }

  formatError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return `Bad request: ${data?.error?.message || 'Invalid parameters'}`;
        case 401:
          return 'Invalid API key or unauthorized access';
        case 429:
          return 'Rate limit exceeded';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Tavily service unavailable';
        default:
          return `HTTP ${status}: ${data?.error?.message || error.message}`;
      }
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timeout';
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'Network error - unable to reach Tavily API';
    }

    return error.message;
  }

  async healthCheck() {
    try {
      if (!this.isConfigured()) {
        return { status: 'not_configured', message: 'API key not set' };
      }

      const startTime = Date.now();
      await axios.get('https://api.tavily.com/health', {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 5000
      });
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        message: 'Tavily API is responsive'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Tavily API health check failed'
      };
    }
  }
}

export const tavilyService = new TavilyService();
export default tavilyService;
