import UserAgent from 'user-agents';

const commonUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.51',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

const acceptLanguages = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.8',
  'en;q=0.9,en-US;q=0.8',
  'en-CA,en;q=0.9,fr-CA;q=0.8',
  'en-AU,en;q=0.9'
];

const acceptHeaders = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
];

class UserAgentRotator {
  constructor() {
    this.userAgentGenerator = new UserAgent();
  }

  getRandomUserAgent() {
    try {
      const agent = this.userAgentGenerator.random();
      return agent.toString();
    } catch (error) {
      return commonUserAgents[Math.floor(Math.random() * commonUserAgents.length)];
    }
  }

  getCommonUserAgent() {
    return commonUserAgents[Math.floor(Math.random() * commonUserAgents.length)];
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': acceptHeaders[Math.floor(Math.random() * acceptHeaders.length)],
      'Accept-Language': acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'DNT': '1',
      ...customHeaders
    };

    return headers;
  }

  getMinimalHeaders() {
    return {
      'User-Agent': this.getCommonUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive'
    };
  }
}

export const userAgentRotator = new UserAgentRotator();
export default userAgentRotator;
