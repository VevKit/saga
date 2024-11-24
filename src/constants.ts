import type { LogLevel, LogSymbol } from "./types";

export const LOG_LEVELS: Record<LogLevel, number> = {
  critical: 5,
  error: 4,
  success: 3,
  warning: 2,
  info: 1,
  debug: 0
};

export const LOG_SYMBOLS: Record<LogLevel, LogSymbol> = {
  critical: '⚡',
  error: '✕',
  success: '▲',
  warning: '▼',
  info: '◆',
  debug: '●'
};