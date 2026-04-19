import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import userAgentRotator from '../utils/userAgentRotator.js';
import textCleaner from '../utils/textCleaner.js';

const REQUEST_TIMEOUT = 10000;
const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB

class ScrapingService {
  constructor() {
    this.proxyUrl = process.env.PROXY_URL || null;
    this.useProxy = !!this.proxyUrl;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch and extract content from a specific URL
   * Used for direct URL access, not search engine scraping
   */
  async fetchUrl(url, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Fetching URL (attempt ${attempt}/${retries}): ${url}`);

        // Validate URL
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error('Invalid URL protocol');
        }

        const headers = userAgentRotator.getHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        });

        const config = {
          method: 'GET',
          url,
          headers,
          timeout: REQUEST_TIMEOUT,
          maxContentLength: MAX_CONTENT_LENGTH,
          responseType: 'text',
          decompress: true,
          validateStatus: (status) => status === 200
        };

        if (this.useProxy) {
          config.proxy = {
            protocol: 'http',
            host: this.proxyUrl
          };
        }

        const response = await axios(config);
        const contentType = response.headers['content-type'] || '';

        if (!contentType.includes('text/html')) {
          logger.warn(`Non-HTML content type: ${contentType}`);
          return null;
        }

        const html = response.data;
        const title = textCleaner.extractTitle(html);
        const content = textCleaner.cleanHtml(html);
        const description = textCleaner.extractMetaDescription(html);

        if (!textCleaner.isValidContent(content)) {
          logger.warn(`Insufficient content from ${url}`);
          return null;
        }

        const snippet = content.length > 300 
          ? content.substring(0, 300) + '...'
          : content;

        return {
          title: title || url,
          url,
          snippet: snippet || description || content.substring(0, 300),
          fullContent: content,
          source: 'direct_fetch'
        };

      } catch (error) {
        logger.error(`Fetch attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt === retries) {
          return null;
        }
        
        await this.sleep(1000 * attempt);
      }
    }

    return null;
  }

  /**
   * Fetch multiple URLs and return their content
   */
  async fetchUrls(urls, maxResults = 5) {
    const results = [];
    const uniqueUrls = [...new Set(urls)].slice(0, maxResults);

    for (const url of uniqueUrls) {
      const result = await this.fetchUrl(url);
      if (result) {
        results.push(result);
      }
      
      // Polite delay between requests
      if (uniqueUrls.indexOf(url) < uniqueUrls.length - 1) {
        await this.sleep(1000 + Math.random() * 1000);
      }
    }

    return results;
  }

  /**
   * Validate if a URL is accessible and returns HTML
   */
  async validateUrl(url) {
    try {
      const headers = userAgentRotator.getMinimalHeaders();
      
      const response = await axios.head(url, {
        headers,
        timeout: 5000,
        validateStatus: (status) => status < 400
      });

      const contentType = response.headers['content-type'] || '';
      return {
        valid: contentType.includes('text/html'),
        contentType,
        status: response.status
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const testUrl = 'https://example.com';
      const result = await this.fetchUrl(testUrl, 1);

      return {
        status: result ? 'healthy' : 'degraded',
        message: result ? 'URL fetching service is operational' : 'URL fetching has issues',
        testUrl: result ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: 'URL fetching service has issues',
        error: error.message
      };
    }
  }
}

export const scrapingService = new ScrapingService();
export default scrapingService;
