import { LOG_LEVELS, LOG_SYMBOLS } from './constants';
import type { Logger, LoggerConfig, LogLevel, LogEntry, LogFn } from './types';

const defaultFormatters = {
  timestamp: (date: Date) => date.toISOString(),
  message: (entry: LogEntry) => 
    `${entry.timestamp} ${entry.symbol} ${entry.message}`
};

const createLogEntry = (
  level: LogLevel,
  message: string,
  config: LoggerConfig,
  extraMetadata?: Record<string, any>
): LogEntry => ({
  level,
  symbol: LOG_SYMBOLS[level],
  message,
  timestamp: new Date(),
  metadata: {
    ...config.metadata,
    ...extraMetadata
  }
});

const shouldLog = (messageLevel: LogLevel, configLevel: LogLevel = 'info'): boolean =>
  LOG_LEVELS[messageLevel] >= LOG_LEVELS[configLevel];

const createBaseLogger = (config: LoggerConfig) => {
  const formatters = {
    ...defaultFormatters,
    ...config.formatters
  };

  // Return a higher-order function that creates our LogFn
  return (level: LogLevel): LogFn => 
    (message: string, metadata?: Record<string, any>) => {
      if (!shouldLog(level, config.level)) return;

      const entry = createLogEntry(level, message, config, metadata);
      const formattedMessage = formatters.message(entry);
      
      console.log(formattedMessage);
    };
};

export const createLogger = (config: LoggerConfig = {}): Logger => {
  const baseLog = createBaseLogger(config);

  return {
    success: baseLog('success'),
    warning: baseLog('warning'),
    info: baseLog('info'),
    debug: baseLog('debug'),
    child: (childConfig) => createLogger({
      ...config,
      ...childConfig,
      metadata: {
        ...config.metadata,
        ...childConfig.metadata
      }
    }),
    withMetadata: (metadata) => createLogger({
      ...config,
      metadata: {
        ...config.metadata,
        ...metadata
      }
    })
  };
};