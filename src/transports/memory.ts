import type { Transport } from "./base";
import type { LogEntry } from '../types';

/**
 * Memory transport for testing purposes
 * Stores log entries in memory for verification
 */
export class MemoryTransport implements Transport {
  private logs: LogEntry[] = [];

  log(entry: LogEntry): void {
    this.logs.push(entry);
  }

  getLogs(): LogEntry[] {
    return [...this.logs]; // Return copy to prevent external modification
  }

  clear(): void {
    this.logs = [];
  }

  getLastLog(): LogEntry | undefined {
    return this.logs[this.logs.length - 1];
  }
}