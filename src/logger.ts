import { LOG_LEVELS, LOG_SYMBOLS } from './constants';
import { createTimestampFormatter } from './formatters';
import { ConsoleTransport, type Transport } from './transports';
import { 
  type Logger as LoggerInterface,
  type LoggerConfig, 
  type LogLevel, 
  type LogEntry, 
  type LogFn,
  type Formatters,
  TransportValidationError
} from './types';

export class Logger implements LoggerInterface {
  private readonly config: LoggerConfig;
  private readonly formatters: Formatters;
  private transports: Transport[] = [];
  private transportFailures: Map<Transport, number>;

  constructor(config: LoggerConfig = {}) {
    this.config = config;
    this.formatters = this.initializeFormatters(config);
    this.transportFailures = new Map();

  // Handle initial transports
  if (config.transports) {
    if (config.validation?.throwOnInvalid) {
      // If throwOnInvalid is true, validate all transports first
      config.transports.forEach(t => this.validateTransport(t));
      this.transports = [...config.transports];
    } else {
      // Otherwise, filter out invalid transports
      this.transports = config.transports.filter(t => this.validateTransport(t));
    }
  }

    // Use console transport if no valid transports
    if (this.transports.length === 0) {
      this.transports = [new ConsoleTransport()];
    }
  }

  private async handleTransportError(transport: Transport, error: Error, entry: LogEntry): Promise<void> {
    // Call error handler if provided
    if (this.config.onTransportError) {
      this.config.onTransportError({ transport, error, entry });
    }

    // Track failures
    const currentFailures = (this.transportFailures.get(transport) || 0) + 1;
    this.transportFailures.set(transport, currentFailures);

    // Check if we should remove the transport
    if (this.config.failureThreshold && currentFailures >= this.config.failureThreshold) {
      this.removeTransport(transport);
      // Clean up failure count
      this.transportFailures.delete(transport);
      
      // If this was the last transport, add console transport as fallback
      if (this.transports.length === 0) {
        this.addTransport(new ConsoleTransport());
      }
    }
  }

  private async tryTransportLog(transport: Transport, entry: LogEntry): Promise<void> {
    try {
      transport.log(entry);
      // Reset failure count on success
      this.transportFailures.delete(transport);
    } catch (error) {
      await this.handleTransportError(transport, error as Error, entry);
    }
  }

  /**
   * Initialize formatters with defaults and overrides from config
   */
  private initializeFormatters(config: LoggerConfig): Formatters {
    const timestampFormatter = config.timestamp ? 
      (typeof config.timestamp === 'string'
        ? createTimestampFormatter({ preset: config.timestamp })
        : createTimestampFormatter(config.timestamp))
      : createTimestampFormatter({ preset: 'datetime' });

    return {
      timestamp: timestampFormatter,
      message: (entry: LogEntry) => {
        // Only get timestamp string if we have a timestamp AND it's not 'none'
        const hasTimestamp = entry.timestamp instanceof Date && 
          (typeof config.timestamp !== 'string' || config.timestamp !== 'none');
        
        const timestampStr = hasTimestamp ? 
          `${timestampFormatter(entry.timestamp)} ` : '';
  
        return `${timestampStr}${entry.symbol} ${entry.message}`;
      },
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

    // Send formatted entry to all transports
    const formattedEntry = {
      ...entry,
      formattedMessage
    };

    this.transports.forEach(transport => {
      this.tryTransportLog(transport, formattedEntry);
    });
  }

  private validateTransport(transport: Transport): boolean {
    const validationErrors: string[] = [];
  
    try {
      // Check if transport is an object
      if (!transport || typeof transport !== 'object') {
        throw new TransportValidationError('Transport must be an object');
      }
  
      // Check log method
      if (typeof transport.log !== 'function') {
        throw new TransportValidationError('Transport must implement log() method');
      }
  
      // Check close method if required
      if (this.config.validation?.requireClose && typeof transport.close !== 'function') {
        throw new TransportValidationError('Transport must implement close() method');
      }
  
      return true;
    } catch (error) {
      if (error instanceof TransportValidationError) {
        if (this.config.validation?.throwOnInvalid) {
          throw error;
        } else {
          console.warn(`Transport validation warning: ${error.message}`);
          return false;
        }
      }
      throw error;  // Re-throw unexpected errors
    }
  }

  // Transport management methods
  public addTransport(transport: Transport): void {
    if (this.validateTransport(transport)) {
      this.transports.push(transport);
    }
  }

  public removeTransport(transport: Transport): void {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
  }

  public clearTransports(): void {
    this.transports = [];
  }

  public getTransports(): Transport[] {
    return [...this.transports]; // Return a copy to prevent external modification
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

  public withMetadata(metadata: Record<string, any>): Logger {
    return this.child({ metadata });
  }

  /**
   * Get current logger configuration
   */
  public getConfig(): Readonly<LoggerConfig> {
    return Object.freeze({ ...this.config });
  }

  public getTransportStatus(): Array<{ transport: Transport; failures: number }> {
    return this.transports.map(transport => ({
      transport,
      failures: this.transportFailures.get(transport) || 0
    }));
  }

  /**
   * Factory method to create a new logger instance
   */
  public static create(config: LoggerConfig = {}): Logger {
    return new Logger(config);
  }
}