import { TimestampConfig, TimestampFormatter, TimestampPreset } from "./formatters";
import type { Transport } from "./transports";

export type LogLevel = 'success' | 'warning' | 'info' | 'debug';
export type LogSymbol = '▲' | '▼' | '◆' | '●';

export interface TransportError {
  transport: Transport;
  error: Error;
  entry: LogEntry;
}

export interface LoggerConfig {
  level?: LogLevel;
  pattern?: string;
  metadata?: Record<string, any>;
  formatters?: Formatters;
  timestamp?: TimestampPreset | TimestampConfig;
  transports?: Transport[];
  onTransportError?: (error: TransportError) => void;
  failureThreshold?: number; // Number of failures before removing transport
}

export interface LogEntry {
  level: LogLevel;
  symbol: LogSymbol;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  formattedMessage?: string;
}

export interface Formatters {
  timestamp?: TimestampFormatter;
  message: (entry: LogEntry) => string;
}

export type LogFn = (message: string, metadata?: Record<string, any>) => void;

export interface Logger {
  success: LogFn;
  warning: LogFn;
  info: LogFn;
  debug: LogFn;
  child: (config: Partial<LoggerConfig>) => Logger;
  withMetadata: (metadata: Record<string, any>) => Logger;
  addTransport: (transport: Transport) => void;
  removeTransport: (transport: Transport) => void;
  clearTransports: () => void;
  getTransports: () => Transport[];
}