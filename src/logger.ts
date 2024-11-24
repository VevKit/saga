import { LOG_LEVELS, LOG_SYMBOLS } from './constants';
import { createTimestampFormatter } from './formatters';
import type { 
  Logger as LoggerInterface,
  LoggerConfig, 
  LogLevel, 
  LogEntry, 
  LogFn,
  Formatters
} from './types';

export class Logger implements LoggerInterface {
  private readonly config: LoggerConfig;
  private readonly formatters: Formatters;

  constructor(config: LoggerConfig = {}) {
    this.config = config;
    this.formatters = this.initializeFormatters(config);
  }

  /**
   * Initialize formatters with defaults and overrides from config
   */
  private initializeFormatters(config: LoggerConfig): Formatters {
    const timestampFormatter = config.timestamp ? 
      (typeof config.timestamp === 'string'
        ? createTimestampFormatter({ preset: config.timestamp })
        : createTimestampFormatter(config.timestamp))
      : createTimestampFormatter({ preset: 'short' });

    const defaultFormatters: Formatters = {
      timestamp: timestampFormatter,
      message: (entry: LogEntry) => {
        const timestampStr = entry.timestamp instanceof Date ? 
          `${timestampFormatter(entry.timestamp)} ` : '';
        return `${timestampStr}${entry.symbol} ${entry.message}`;
      }
    };

    return {
      ...defaultFormatters,
      ...config.formatters
    };
  }

  /**
   * Create a log entry with metadata
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    extraMetadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      symbol: LOG_SYMBOLS[level],
      message,
      timestamp: new Date(),
      metadata: {
        ...this.config.metadata,
        ...extraMetadata
      }
    };
  }

  /**
   * Check if a message should be logged based on level
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    return LOG_LEVELS[messageLevel] >= LOG_LEVELS[this.config.level ?? 'info'];
  }

  /**
   * Internal logging method used by all log levels
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, metadata);
    const formattedMessage = this.formatters.message(entry);
    
    console.log(formattedMessage);
  }

  // Public logging methods
  public success(message: string, metadata?: Record<string, any>): void {
    this.log('success', message, metadata);
  }

  public warning(message: string, metadata?: Record<string, any>): void {
    this.log('warning', message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Create a child logger with merged configuration
   */
  public child(childConfig: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      ...childConfig,
      metadata: {
        ...this.config.metadata,
        ...childConfig.metadata
      }
    });
  }

  /**
   * Create a new logger with additional metadata
   */
  public withMetadata(metadata: Record<string, any>): Logger {
    return this.child({ metadata });
  }

  /**
   * Get current logger configuration
   */
  public getConfig(): Readonly<LoggerConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Factory method to create a new logger instance
   */
  public static create(config: LoggerConfig = {}): Logger {
    return new Logger(config);
  }
}