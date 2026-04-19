# MCP Internet Server - Project Summary

## Overview

A production-ready MCP (Model Context Protocol) backend server that provides intelligent internet access tools for Large Language Models (LLMs). Built with cost optimization, resilience, and scalability in mind.

## ✅ Completed Features

### Core Features
1. **Smart Search Tool** (`POST /tools/smart_search`)
   - Redis caching (24-hour TTL)
   - Usage control (34 daily, 1000 monthly limits)
   - Tavily API integration with retry logic
   - Direct URL fetching as fallback
   - Normalized JSON response format

2. **Direct URL Fetching** (`POST /tools/fetch_url`)
   - HTML content extraction
   - Anti-blocking headers (User-Agent rotation)
   - Clean text processing
   - Request timeouts

3. **Usage Management**
   - Daily/monthly API tracking
   - Auto-reset on new day/month
   - Redis-based persistence

4. **Caching System**
   - Redis-based storage
   - 24-hour TTL
   - Query normalization
   - Cache statistics

5. **Health Monitoring**
   - Comprehensive health checks
   - Service status reporting
   - Usage statistics endpoint

### Security Features
- Helmet.js security headers
- CORS configuration
- Rate limiting (global: 60/min, search: 30/min, admin: 10/min)
- Request ID tracking
- Input validation

### Production Features
- Winston logging (console + file)
- Graceful shutdown handling
- Error handling middleware
- Environment-based configuration
- Docker support
- PM2 process management

## 📁 Project Structure

```
mcp-internet-server/
├── server.js                    # Main entry point
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
│
├── routes/
│   └── toolsRoutes.js           # Express routes
│
├── controllers/
│   └── toolsController.js       # Request handlers
│
├── services/
│   ├── searchService.js         # Main orchestration
│   ├── tavilyService.js         # Tavily API client
│   ├── scrapingService.js       # URL fetching
│   ├── cacheService.js          # Redis caching
│   └── usageService.js          # Usage tracking
│
├── utils/
│   ├── logger.js                # Winston logger
│   ├── userAgentRotator.js      # UA rotation
│   └── textCleaner.js           # HTML/text cleaning
│
├── config/
│   └── redis.js                 # Redis client
│
├── logs/                        # Log files (created at runtime)
│
└── Documentation/
    ├── README.md                # Main documentation
    ├── INSTALLATION.md          # Setup guide
    ├── API_EXAMPLES.md          # API usage examples
    ├── SYSTEM_PROMPT.md         # LLM system prompt
    ├── MCP_TOOL_CONFIG.json     # MCP configuration
    └── mcp.json                 # MCP client config
```

## 🔧 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.19+
- **HTTP Client**: Axios 1.6+
- **HTML Parsing**: Cheerio 1.0+
- **Redis Client**: ioredis 5.4+
- **User Agents**: user-agents 1.1+
- **Logging**: Winston 3.13+
- **Security**: Helmet 7.1+, CORS 2.8+
- **Rate Limiting**: express-rate-limit 7.2+
- **Environment**: dotenv 16.4+

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your TAVILY_API_KEY and REDIS_URL

# Start server
npm start

# Test
curl http://localhost:3000/health
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tools/smart_search | Intelligent search with caching |
| POST | /tools/fetch_url | Fetch content from URL |
| GET | /tools/usage | Usage statistics |
| POST | /tools/clear_cache | Clear cache (admin) |
| POST | /tools/reset_usage | Reset usage (admin) |
| GET | /health | Health check |
| GET | /api-docs | API documentation |
| GET | /.well-known/mcp | MCP manifest |

## 💰 Cost Optimization

- **Free Tier**: Tavily offers 1000 searches/month
- **Caching**: 24-hour cache prevents repeated API calls
- **Usage Tracking**: Prevents exceeding free limits
- **Direct Fetching**: Falls back to URL fetching when limits reached

## 🔒 Compliance

- Uses official Tavily API (no scraping)
- Direct URL fetching only (no search engine scraping)
- Respects rate limits
- Proper User-Agent headers
- Request timeouts to prevent hanging

## 📈 Scalability

- Stateless design (data in Redis)
- Horizontal scaling ready
- Docker containerization
- Health checks for load balancers
- Redis for distributed caching

## 🛡️ Error Handling

- Graceful degradation
- Retry logic with exponential backoff
- Fallback mechanisms
- Comprehensive logging
- User-friendly error messages

## 🔍 Monitoring

- Winston logger (console + files)
- Health check endpoint
- Usage statistics
- Request ID tracking
- Memory usage reporting

## 📚 Documentation

1. **README.md** - Overview and quick start
2. **INSTALLATION.md** - Detailed setup instructions
3. **API_EXAMPLES.md** - API usage examples
4. **SYSTEM_PROMPT.md** - LLM tool usage guidelines
5. **MCP_TOOL_CONFIG.json** - MCP configuration

## 🎯 Production Checklist

- [x] Environment variables configured
- [x] Redis connection working
- [x] Tavily API key set
- [x] CORS origins configured
- [x] Rate limiting enabled
- [x] Security headers enabled
- [x] Logging configured
- [x] Health checks working
- [x] Graceful shutdown handling
- [x] Error handling middleware
- [x] Docker configuration
- [x] PM2 configuration

## 🔄 Flow Diagram

```
User Request
    │
    ▼
POST /tools/smart_search
    │
    ▼
Input Validation
    │
    ▼
Cache Check (Redis)
    │
    ├─► Cache Hit ──► Return Cached Result
    │
    └─► Cache Miss
        │
        ▼
    Usage Check (Redis)
        │
        ├─► Limits Reached ──► Try Direct URL Fetch
        │
        └─► Within Limits
            │
            ▼
        Tavily API Call
            │
            ├─► Success ──► Cache Result ──► Return
            │
            └─► Failure ──► Try Direct URL Fetch
```

## 📝 Example MCP Configuration

```json
{
  "mcpServers": {
    "internet-search": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "TAVILY_API_KEY": "tvly-...",
        "REDIS_URL": "redis://localhost:6379"
      }
    }
  }
}
```

## 🎓 Learn More

- [Tavily API Docs](https://docs.tavily.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Express.js](https://expressjs.com/)
- [Redis](https://redis.io/)

## 📄 License

MIT License - See package.json

---

**Status**: Production Ready ✅
**Version**: 1.0.0
**Last Updated**: 2024
