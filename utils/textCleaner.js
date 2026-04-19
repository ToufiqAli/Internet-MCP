import * as cheerio from 'cheerio';

class TextCleaner {
  constructor() {
    this.maxLength = 5000;
    this.minLength = 100;
  }

  cleanHtml(html) {
    try {
      const $ = cheerio.load(html, {
        xml: {
          normalizeWhitespace: true
        }
      });

      $('script, style, noscript, iframe, object, embed, head, meta, link, base').remove();
      
      $('[class*="nav"], [class*="menu"], [class*="sidebar"], [class*="footer"]').each((i, elem) => {
        $(elem).remove();
      });
      
      $('[id*="nav"], [id*="menu"], [id*="sidebar"], [id*="footer"]').each((i, elem) => {
        $(elem).remove();
      });

      $('a').each((i, elem) => {
        const text = $(elem).text();
        $(elem).replaceWith(text);
      });

      let text = $.text();
      
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\t+/g, ' ')
        .replace(/\r/g, '')
        .replace(/\s+([.,;:!?])/g, '$1')
        .replace(/([.,;:!?])\s+/g, '$1 ')
        .trim();

      if (text.length > this.maxLength) {
        text = text.substring(0, this.maxLength).trim() + '... [truncated]';
      }

      return text;
    } catch (error) {
      return '';
    }
  }

  extractTitle(html) {
    try {
      const $ = cheerio.load(html);
      const title = $('title').first().text().trim() || 
                    $('h1').first().text().trim() || 
                    $('meta[property="og:title"]').attr('content') ||
                    '';
      return title;
    } catch (error) {
      return '';
    }
  }

  extractMetaDescription(html) {
    try {
      const $ = cheerio.load(html);
      const description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') ||
                          '';
      return description;
    } catch (error) {
      return '';
    }
  }

  isValidContent(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    const trimmed = text.trim();
    return trimmed.length >= this.minLength;
  }

  normalizeQuery(query) {
    if (!query || typeof query !== 'string') {
      return '';
    }
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .substring(0, 200);
  }

  sanitizeForCache(key) {
    if (!key || typeof key !== 'string') {
      return '';
    }
    return key
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 100);
  }
}

export const textCleaner = new TextCleaner();
export default textCleaner;
