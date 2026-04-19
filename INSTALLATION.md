# Installation Guide

## System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Redis**: Version 6.0 or higher
- **Memory**: At least 512MB RAM
- **Storage**: At least 100MB free space

## Step-by-Step Installation

### 1. Install Node.js

**Windows:**
```powershell
# Download from https://nodejs.org/en/download/
# Or use Chocolatey
choco install nodejs
```

**macOS:**
```bash
# Using Homebrew
brew install node
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install Redis

**Windows (using WSL or Docker):**
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis
redis-cli ping
# Should return: PONG
```

### 3. Clone and Setup Project

```bash
# Navigate to project directory
cd mcp-internet-server

# Install dependencies
npm install

# This will install:
# - express: Web framework
# - axios: HTTP client
# - cheerio: HTML parsing
# - ioredis: Redis client
# - cors: CORS middleware
# - helmet: Security headers
# - morgan: Request logging
# - winston: Application logging
# - user-agents: User-Agent rotation
# - dotenv: Environment variables
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Required Variables:**
```bash
PORT=3000
TAVILY_API_KEY=tvly-your-api-key-here
REDIS_URL=redis://localhost:6379
```

**Get Tavily API Key:**
1. Visit https://app.tavily.com/
2. Sign up for an account
3. Generate an API key
4. Free tier includes 1000 searches/month

### 5. Create Logs Directory

```bash
# Create logs directory
mkdir logs

# On Windows
New-Item -ItemType Directory -Path logs
```

### 6. Test Installation

```bash
# Start the server
npm start

# You should see:
# ============================================================
# MCP Internet Server Started
# ============================================================
# Environment: development
# Port: 3000
# Redis: redis://localhost:6379
# Tavily API: configured (or not configured)
# ============================================================

# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "services": {
#     "redis": { "connected": true },
#     "tavily": "configured"
#   }
# }
```

## Development Mode

```bash
# Start with auto-reload on file changes
npm run dev

# This uses nodemon to watch for changes
```

## Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name mcp-internet-server

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs mcp-internet-server
```

### Using Docker

```bash
# Build Docker image
docker build -t mcp-internet-server .

# Run with Redis
docker run -d --name redis -p 6379:6379 redis:alpine
docker run -d --name mcp-server -p 3000:3000 \
  -e TAVILY_API_KEY=your-key \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  mcp-internet-server
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - REDIS_URL=redis://redis:6379
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
```

Run:
```bash
docker-compose up -d
```

## Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# If not running:
sudo systemctl start redis-server  # Linux
brew services start redis          # macOS
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Tavily API Errors
```bash
# Check API key is set
echo $TAVILY_API_KEY

# Verify in .env file
cat .env
```

### Permission Denied
```bash
# Fix permissions on Linux/Mac
chmod +x server.js
sudo chown -R $(whoami) .
```

## Verification Checklist

- [ ] Node.js installed (v18+)
- [ ] Redis running and accessible
- [ ] npm install completed without errors
- [ ] .env file created with TAVILY_API_KEY
- [ ] logs/ directory exists
- [ ] Server starts without errors
- [ ] /health endpoint returns healthy status
- [ ] /tools/smart_search test request works
