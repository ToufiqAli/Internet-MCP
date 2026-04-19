import winston from 'winston';
import { join } from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Detect serverless environment (AWS Lambda, etc.)
const isServerless = () => {
  return !!(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.FUNCTION_NAME // Google Cloud Functions
  );
};

// Detect if file system is writable (for local development)
const isLocalDev = () => {
  return !isServerless() && (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV === 'true');
};

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Build transports array based on environment
const buildTransports = () => {
  const transports = [
    // Console transport always enabled (works everywhere including serverless)
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ];

  // Only add File transports in local development (not in serverless)
  if (isLocalDev()) {
    // Use /tmp/logs for serverless if needed, or logs/ for local
    const logDir = isServerless() ? '/tmp/logs' : 'logs';
    
    transports.push(
      new winston.transports.File({ 
        filename: join(logDir, 'error.log'), 
        level: 'error',
        format: combine(timestamp(), logFormat)
      }),
      new winston.transports.File({ 
        filename: join(logDir, 'combined.log'),
        format: combine(timestamp(), logFormat)
      })
    );
  }

  return transports;
};

// Build exception and rejection handlers
const buildHandlers = () => {
  if (isLocalDev()) {
    const logDir = isServerless() ? '/tmp/logs' : 'logs';
    return [
      new winston.transports.File({ filename: join(logDir, 'exceptions.log') })
    ];
  }
  // In serverless, use console for exceptions too
  return [new winston.transports.Console()];
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: buildTransports(),
  exceptionHandlers: buildHandlers(),
  rejectionHandlers: buildHandlers(),
  // Don't exit on error in production/serverless
  exitOnError: false
});

// Log environment info on startup
logger.info(`Logger initialized - Environment: ${isServerless() ? 'serverless' : 'standard'}, File logging: ${isLocalDev() ? 'enabled' : 'disabled'}`);

export default logger;
