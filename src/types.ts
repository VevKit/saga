import { TimestampConfig, TimestampFormatter, TimestampPreset } from "./formatters";
import type { Transport } from "./transports";

export type LogLevel = 'critical' | 'error' | 'success' | 'warning' | 'info' | 'debug';
export type LogSymbol = '⚡' | '✕' | '▲' | '▼' | '◆' | '●';

export interface TransportError {
  transport: Transport;
  error: Error;
  entry: LogEntry;
}

export class TransportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransportValidationError';
  }
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
  validation?: {
    throwOnInvalid?: boolean;  // Whether to throw or just warn on validation failure
    requireClose?: boolean;     // Whether to require close() method
  };
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
  critical: LogFn;
  error: LogFn;
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