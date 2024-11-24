import { LogEntry } from "../types";

/**
 * Base interface that all transports must implement
 */
export interface Transport {
  /**
   * Process and output a log entry
   */
  log(entry: LogEntry): void;

  /**
   * Optional method to clean up transport resources
   */
  close?(): Promise<void>;
}

/**
 * Default console transport implementation
 */
export class ConsoleTransport implements Transport {
  log(entry: LogEntry): void {
    // Use the already formatted message from the entry
    // This maintains consistency with our current logger output
    const timestamp = entry.timestamp instanceof Date ? 
      entry.timestamp.toISOString() : 
      entry.timestamp;
      
    console.log(`${timestamp} ${entry.symbol} ${entry.message}`);
  }
}