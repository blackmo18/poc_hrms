import winston from 'winston';

// Define log levels with colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format with Java-style format: timestamp | file source | log message
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const caller = info.caller || '';
      const levelColor = info.level;
      const callerInfo = caller ? ` | ${caller}` : '';
      return `${info.timestamp} | ${levelColor}${callerInfo} | ${info.message}${
        info.stack ? '\n' + info.stack : ''
      }${
        info.metadata && Object.keys(info.metadata).length > 0 
          ? '\n' + JSON.stringify(info.metadata, null, 2) 
          : ''
      }`;
    }
  ),
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: { service: 'hr-payroll-system' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: logFormat,
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

// Helper function to get caller information
const getCaller = () => {
  const stack = new Error().stack;
  if (!stack) return '';
  
  const lines = stack.split('\n');
  // Skip the Error constructor and this function call
  // Get the actual caller (3rd line in stack)
  const callerLine = lines[3] || '';
  const match = callerLine.match(/at.*\((.*):(\d+):(\d+)\)/);
  
  if (match) {
    const filePath = match[1];
    const lineNumber = match[2];
    // Extract just the filename from the full path
    const fileName = filePath.split('/').pop() || filePath;
    return `${fileName}:${lineNumber}`;
  }
  
  return '';
};

// Export convenience methods
export const logInfo = (message: string, metadata?: any) => {
  logger.info(message, { ...metadata, caller: getCaller() });
};

export const logError = (message: string, error?: Error | any, metadata?: any) => {
  logger.error(message, { error, ...metadata, caller: getCaller() });
};

export const logWarn = (message: string, metadata?: any) => {
  logger.warn(message, { ...metadata, caller: getCaller() });
};

export const logDebug = (message: string, metadata?: any) => {
  logger.debug(message, { ...metadata, caller: getCaller() });
};

export default logger;
