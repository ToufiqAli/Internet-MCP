# API Examples

## Base URL
```
http://localhost:3000
```

## 1. Smart Search

### Basic Search
```bash
curl -X POST http://localhost:3000/tools/smart_search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments 2024"
  }'
```

### Response
```json
{
  "success": true,
  "source": "tavily",
  "data": [
    {
      "title": "AI Advances in 2024: What to Expect",
      "url": "https://example.com/ai-2024",
      "snippet": "Latest developments in artificial intelligence...",
      "score": 0.95
    },
    {
      "title": "Top AI Trends for 2024",
      "url": "https://example.com/ai-trends",
      "snippet": "The most significant AI trends...",
      "score": 0.92
    }
  ],
  "cached": false,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "1705312200123-abc123"
}
```

### Search with Direct URLs
```bash
curl -X POST http://localhost:3000/tools/smart_search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "OpenAI news",
    "options": {
      "urls": [
        "https://openai.com/blog",
        "https://openai.com/research"
      ]
    }
  }'
```

### Cached Response
```json
{
  "success": true,
  "source": "cache",
  "data": [
    {
      "title": "AI Advances in 2024",
      "url": "https://example.com/ai-2024",
      "snippet": "Latest developments..."
    }
  ],
  "cached": true,
  "timestamp": "2024-01-15T09:00:00.000Z",
  "requestId": "1705312200456-def456"
}
```

### Usage Limit Reached
```json
{
  "success": false,
  "source": "none",
  "data": [],
  "error": "Usage limits reached: 34/34 daily, 456/1000 monthly",
  "usage": {
    "daily": {
      "used": 34,
      "limit": 34,
      "remaining": 0
    },
    "monthly": {
      "used": 456,
      "limit": 1000,
      "remaining": 544
    }
  }
}
```

## 2. Fetch URL

### Request
```bash
curl -X POST http://localhost:3000/tools/fetch_url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article"
  }'
```

### Response
```json
{
  "success": true,
  "source": "direct_fetch",
  "data": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "snippet": "Clean extracted text from the article...",
      "fullContent": "Full cleaned content of the article..."
    }
  ],
  "requestId": "1705312200789-ghi789"
}
```

### Invalid URL
```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

## 3. Usage Statistics

### Request
```bash
curl http://localhost:3000/tools/usage
```

### Response
```json
{
  "success": true,
  "daily": {
    "used": 5,
    "limit": 34,
    "remaining": 29,
    "percentage": 14.7
  },
  "monthly": {
    "used": 45,
    "limit": 1000,
    "remaining": 955,
    "percentage": 4.5
  },
  "firstUse": "2024-01-15T08:00:00.000Z"
}
```

## 4. Health Check

### Request
```bash
curl http://localhost:3000/health
```

### Healthy Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "redis": {
      "connected": true
    },
    "tavily": "configured"
  },
  "version": "1.0.0"
}
```

### Degraded Response
```json
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "redis": {
      "connected": false,
      "error": "Connection refused"
    },
    "tavily": "not_configured"
  }
}
```

## 5. Admin Operations

### Clear Cache
```bash
curl -X POST http://localhost:3000/tools/clear_cache \
  -H "Content-Type: application/json"
```

```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

### Reset Usage
```bash
# Reset daily usage
curl -X POST http://localhost:3000/tools/reset_usage \
  -H "Content-Type: application/json" \
  -d '{"type": "daily"}'

# Reset monthly usage
curl -X POST http://localhost:3000/tools/reset_usage \
  -H "Content-Type: application/json" \
  -d '{"type": "monthly"}'

# Reset all
curl -X POST http://localhost:3000/tools/reset_usage \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

## 6. MCP Manifest

### Request
```bash
curl http://localhost:3000/.well-known/mcp
```

### Response
```json
{
  "schema_version": "1.0",
  "name": "mcp-internet-server",
  "description": "MCP server providing internet search and URL content access",
  "version": "1.0.0",
  "tools": [
    {
      "name": "smart_search",
      "description": "Search the internet using Tavily API...",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The search query"
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

## Error Examples

### Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "retryAfter": 60
}
```

### Missing Required Field
```json
{
  "success": false,
  "error": "Query is required and must be a non-empty string"
}
```

### Query Too Long
```json
{
  "success": false,
  "error": "Query exceeds maximum length of 500 characters"
}
```

### Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## MCP Client Integration

### Claude Desktop Config

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "internet-search": {
      "command": "node",
      "args": ["C:/path/to/mcp-internet-server/server.js"],
      "env": {
        "TAVILY_API_KEY": "tvly-your-api-key",
        "REDIS_URL": "redis://localhost:6379",
        "PORT": "3000"
      }
    }
  }
}
```

### Usage in Claude

```
Can you search for information about [topic]?

Claude will use: smart_search({"query": "[topic]"})
```

## Testing with curl

### Test Script
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "Testing Health..."
curl -s "$BASE_URL/health" | jq .

echo -e "\n\nTesting Smart Search..."
curl -s -X POST "$BASE_URL/tools/smart_search" \
  -H "Content-Type: application/json" \
  -d '{"query": "Node.js best practices"}' | jq .

echo -e "\n\nTesting Usage Stats..."
curl -s "$BASE_URL/tools/usage" | jq .

echo -e "\n\nDone!"
```
