// Simple client-side logger for browser environment
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp?: string;
  metadata?: any;
}

class SimpleLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp || new Date().toISOString();
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    return `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${metadata}`;
  }

  error(message: string, metadata?: any): void {
    const entry: LogEntry = { level: 'error', message, metadata };
    if (this.isDevelopment) {
      console.error(this.formatMessage(entry));
    }
  }

  warn(message: string, metadata?: any): void {
    const entry: LogEntry = { level: 'warn', message, metadata };
    if (this.isDevelopment) {
      console.warn(this.formatMessage(entry));
    }
  }

  info(message: string, metadata?: any): void {
    const entry: LogEntry = { level: 'info', message, metadata };
    if (this.isDevelopment) {
      console.info(this.formatMessage(entry));
    }
  }

  debug(message: string, metadata?: any): void {
    const entry: LogEntry = { level: 'debug', message, metadata };
    if (this.isDevelopment) {
      console.debug(this.formatMessage(entry));
    }
  }
}

// Export singleton instance
export const logger = new SimpleLogger();

// Export convenience functions
export const logError = (message: string, metadata?: any) => logger.error(message, metadata);
export const logWarn = (message: string, metadata?: any) => logger.warn(message, metadata);
export const logInfo = (message: string, metadata?: any) => logger.info(message, metadata);
export const logDebug = (message: string, metadata?: any) => logger.debug(message, metadata);
