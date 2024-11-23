import { TimestampConfig, TimestampFormatter, TimestampPreset } from "./formatters";

export type LogLevel = 'success' | 'warning' | 'info' | 'debug';
export type LogSymbol = '▲' | '▼' | '◆' | '●';

export interface LoggerConfig {
  level?: LogLevel;
  pattern?: string;
  metadata?: Record<string, any>;
  formatters?: Formatters;
  timestamp?: TimestampPreset | TimestampConfig;
}

export interface LogEntry {
  level: LogLevel;
  symbol: LogSymbol;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Formatters {
  timestamp?: TimestampFormatter;
  message?: (entry: LogEntry) => string;
}

export type LogFn = (message: string, metadata?: Record<string, any>) => void;

export interface Logger {
  success: LogFn;
  warning: LogFn;
  info: LogFn;
  debug: LogFn;
  child: (config: Partial<LoggerConfig>) => Logger;
  withMetadata: (metadata: Record<string, any>) => Logger;
}