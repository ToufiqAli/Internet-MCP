import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import toolsRoutes from './routes/toolsRoutes.js';
import logger from './utils/logger.js';
import { getRedisStatus } from './config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: NODE_ENV === 'production'
}));

// CORS configuration - allow all origins for opencode compatibility
const corsOptions = {
  origin: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
const morganFormat = NODE_ENV === 'production' 
  ? ':remote-addr - :method :url :status :res[content-length] - :response-time ms'
  : 'dev';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Request ID middleware
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Global rate limiter
const globalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

// Health check endpoint (before routes)
app.get('/health', async (req, res) => {
  const redisStatus = await getRedisStatus();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    services: {
      redis: redisStatus,
      tavily: process.env.TAVILY_API_KEY ? 'configured' : 'not_configured'
    },
    version: process.env.npm_package_version || '1.0.0'
  };

  const statusCode = redisStatus.connected ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
app.use('/tools', toolsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Internet Server',
    description: 'Production-ready MCP backend server for intelligent internet access',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      smart_search: 'POST /tools/smart_search',
      fetch_url: 'POST /tools/fetch_url',
      health: 'GET /tools/health',
      usage: 'GET /tools/usage'
    },
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'MCP Internet Server API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: [
      {
        path: '/tools/smart_search',
        method: 'POST',
        description: 'Perform intelligent search with caching and usage tracking',
        body: {
          query: 'string (required) - Search query',
          options: {
            urls: ['array of URLs to fetch directly (optional)'],
            maxResults: 'number (optional) - Maximum results to return'
          }
        },
        response: {
          success: 'boolean',
          source: 'string (cache | tavily | direct_fetch | none)',
          data: 'array of search results',
          cached: 'boolean',
          timestamp: 'string (ISO 8601)'
        }
      },
      {
        path: '/tools/fetch_url',
        method: 'POST',
        description: 'Fetch and extract content from a specific URL',
        body: {
          url: 'string (required) - URL to fetch'
        }
      },
      {
        path: '/tools/health',
        method: 'GET',
        description: 'Get system health status'
      },
      {
        path: '/tools/usage',
        method: 'GET',
        description: 'Get current usage statistics'
      },
      {
        path: '/health',
        method: 'GET',
        description: 'Quick health check'
      }
    ],
    rateLimits: {
      global: '60 requests per minute',
      search: '30 requests per minute',
      admin: '10 requests per minute'
    },
    limits: {
      daily: 34,
      monthly: 1000,
      cacheTtl: '24 hours'
    }
  });
});

// MCP tool manifest endpoint (for MCP client discovery)
app.get('/.well-known/mcp', (req, res) => {
  res.json({
    schema_version: '1.0',
    name: 'mcp-internet-server',
    description: 'MCP server providing internet search and URL content access',
    version: '1.0.0',
    tools: [
      {
        name: 'smart_search',
        description: 'Search the internet using Tavily API with intelligent caching and fallback to direct URL fetching',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'fetch_url',
        description: 'Fetch and extract readable content from a specific URL',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to fetch content from'
            }
          },
          required: ['url']
        }
      }
    ],
    endpoints: {
      tools: `${req.protocol}://${req.get('host')}/tools`
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info('MCP Internet Server Started');
  logger.info('='.repeat(60));
  logger.info(`Environment: ${NODE_ENV}`);
  logger.info(`Port: ${PORT}`);
  logger.info(`Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
  logger.info(`Tavily API: ${process.env.TAVILY_API_KEY ? 'configured' : 'not configured'}`);
  logger.info(`CORS Origins: ${corsOptions.origin.join(', ')}`);
  logger.info('='.repeat(60));
});

export default app;
