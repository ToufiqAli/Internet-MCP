# MCP Internet Server

A production-ready MCP (Model Context Protocol) backend server providing intelligent internet access tools for LLMs. Built with Node.js, Express, Redis caching, and Tavily API integration.

## Features

- **Smart Search**: Intelligent search using Tavily API with 24-hour Redis caching
- **Usage Management**: Daily (34) and monthly (1000) API request limits with auto-reset
- **Direct URL Fetching**: Extract readable content from specific URLs
- **Health Monitoring**: Comprehensive health checks and usage statistics
- **Rate Limiting**: Configurable request throttling for production safety
- **Graceful Degradation**: Falls back to direct URL fetching when API limits reached

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Redis (local or cloud)
- Tavily API key (get from https://app.tavily.com/)

### Installation

```bash
# Clone and navigate to project
cd mcp-internet-server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
npm start

# Or development mode with auto-reload
npm run dev
```

### Environment Variables

```bash
PORT=3000
NODE_ENV=production
TAVILY_API_KEY=tvly-your-api-key-here
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

## API Endpoints

### POST /tools/smart_search
Search the internet with intelligent caching.

**Request:**
```json
{
  "query": "latest AI developments 2024",
  "options": {
    "urls": ["https://openai.com/blog"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "source": "tavily",
  "data": [
    {
      "title": "OpenAI announces GPT-5",
      "url": "https://openai.com/blog/gpt-5",
      "snippet": "Latest developments in AI..."
    }
  ],
  "cached": false,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /tools/fetch_url
Fetch content from a specific URL.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

### GET /tools/usage
Get current API usage statistics.

### GET /health
Quick health check endpoint.

### GET /api-docs
Full API documentation.

## Architecture

```
server.js           # Main entry point
├── routes/         # Express routes
├── controllers/    # Request handlers
├── services/       # Business logic
│   ├── searchService.js      # Main orchestration
│   ├── tavilyService.js      # Tavily API
│   ├── scrapingService.js    # URL fetching
│   ├── cacheService.js       # Redis caching
│   └── usageService.js       # Usage tracking
├── utils/          # Utilities
│   ├── logger.js
│   ├── userAgentRotator.js
│   └── textCleaner.js
└── config/         # Configuration
    └── redis.js
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment

- Use Redis Cloud or AWS ElastiCache
- Set NODE_ENV=production
- Configure CORS_ORIGIN for your domain
- Enable Helmet security headers

### Monitoring

- Logs: `logs/` directory with Winston
- Health: `/health` endpoint
- Usage: `/tools/usage` endpoint

## Rate Limits

- Global: 60 requests/minute
- Search: 30 requests/minute
- Tavily API: 34/day, 1000/month

## License

MIT
