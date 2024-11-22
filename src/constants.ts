import type { LogLevel, LogSymbol } from "./types";

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  success: 3,
};

export const LOG_SYMBOLS: Record<LogLevel, LogSymbol> = {
  success: '▲',
  warning: '▼',
  info: '◆',
  debug: '●',
};