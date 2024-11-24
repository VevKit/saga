# @vevkit/saga

A lightweight, modular logging system designed to be flexible and efficient. Saga provides structured logging with support for custom transports, configurable timestamps, metadata handling, and robust error management.

## Features

- 🎯 **Multiple Log Levels**: Support for debug, info, warning, and success levels
- 🕒 **Flexible Timestamp Formats**: Multiple built-in formats and custom formatting support
- 🔧 **Extensible Transport System**: Write logs to any destination with custom transports
- 📦 **Metadata Support**: Attach structured data to your logs
- 👶 **Child Loggers**: Create loggers with inherited and extended metadata
- ⚡ **Error Handling**: Built-in transport error handling and recovery
- 🪶 **Lightweight**: Zero external dependencies

## Installation

```bash
npm install @vevkit/saga
```

# @vevkit/saga

> A powerful, Nordic-inspired logging library for JavaScript/TypeScript applications

Part of the [VevKit](https://github.com/vevkit) ecosystem, `@vevkit/saga` provides a lightweight, pattern-based logging system that emphasizes clarity and meaningful status indicators.

## Features

- 🌟 Six distinct log levels with Nordic-inspired symbols
- 🧬 Class-based architecture
- 🎨 Visual log hierarchy
- 🧩 Composable logging patterns
- 🎯 TypeScript-first development
- 🔍 Structured metadata support
- 🌳 Hierarchical logger creation
- 🎭 Flexible formatting options

## Installation

```bash
npm install @vevkit/saga
```

## Quick Start

```typescript
import { createLogger } from '@vevkit/saga';

// Create a base logger
const logger = createLogger({ level: 'info' });

// Log at different levels
logger.critical('System crash imminent');     // ⚡ System crash imminent
logger.error('Database connection failed');   // ✕ Database connection failed
logger.success('Operation completed');        // ▲ Operation completed
logger.warning('Resource running low');       // ▼ Resource running low
logger.info('Processing request');           // ◆ Processing request
logger.debug('Cache miss');                  // ● Cache miss

// Add metadata
logger.error('Authentication failed', { 
  userId: '123', 
  reason: 'invalid_token' 
});

// Create specialized logger
const apiLogger = logger.child({
  metadata: { service: 'api' }
});

apiLogger.warning('Rate limit approaching');
```

## Log Levels

`@vevkit/saga` uses Nordic-inspired symbols to provide clear visual hierarchy in logs:

| Level    | Symbol | Usage                                        | Example                           |
|----------|--------|----------------------------------------------|-----------------------------------|
| Critical | ⚡     | System-wide emergencies requiring immediate action | "Service completely unavailable" |
| Error    | ✕      | Error conditions that need attention        | "Failed to connect to database"   |
| Success  | ▲      | Successful operations and completions       | "Payment processed successfully"   |
| Warning  | ▼      | Warning conditions or potential issues      | "High memory usage detected"      |
| Info     | ◆      | General informational messages             | "Application started"             |
| Debug    | ●      | Detailed debug information                 | "Cache hit for key: user:123"     |

## Configuration

```typescript
interface LoggerConfig {
  level?: 'critical' | 'error' | 'success' | 'warning' | 'info' | 'debug';
  pattern?: string;
  metadata?: Record<string, any>;
  formatters?: {
    timestamp?: (date: Date) => string;
    message?: (entry: LogEntry) => string;
  };
}

// Example configuration
const logger = createLogger({
  level: 'info',            // Minimum log level
  metadata: {               // Global metadata
    service: 'auth',
    version: '1.0.0'
  },
  formatters: {            // Custom formatters
    timestamp: (date) => date.toISOString(),
    message: (entry) => `[${entry.timestamp}] ${entry.symbol} ${entry.message}`
  }
});
```

## Basic Usage

### Simple Logging

```typescript
import { Logger } from '@vevkit/saga';

// Create a default logger
const logger = new Logger();

// Log at different levels
logger.info('Application started');
logger.success('Operation completed successfully');
logger.warning('Resource usage high');
logger.debug('Connection details:', { host: 'localhost', port: 3000 });
```

### Custom Timestamp Formats

```typescript
import { Logger } from '@vevkit/saga';

// Available timestamp presets
const logger1 = new Logger({ timestamp: 'short' });     // 14:32:24
const logger2 = new Logger({ timestamp: 'time' });      // 14:32:24.432
const logger3 = new Logger({ timestamp: 'date' });      // 2024-11-22
const logger4 = new Logger({ timestamp: 'datetime' });  // 2024-11-22 14:32:24
const logger5 = new Logger({ timestamp: 'iso' });       // 2024-11-22T14:32:24.432Z
const logger6 = new Logger({ timestamp: 'compact' });   // 20241122143224
const logger7 = new Logger({ timestamp: 'relative' });  // 2s ago
const logger8 = new Logger({ timestamp: 'none' });      // No timestamp

// Custom timestamp format
const logger9 = new Logger({
  timestamp: {
    custom: (date) => `[${date.getHours()}:${date.getMinutes()}]`
  }
});
```

### Working with Metadata

```typescript
// Base logger with common metadata
const logger = new Logger({
  metadata: {
    service: 'user-service',
    version: '1.0.0'
  }
});

// Add request-specific metadata
logger.info('Processing request', {
  requestId: '123',
  userId: '456'
});
// Output: 2024-11-22 14:32:24 ◆ Processing request
// Metadata: { service: 'user-service', version: '1.0.0', requestId: '123', userId: '456' }

// Create a child logger with additional metadata
const requestLogger = logger.child({
  metadata: {
    requestId: '123',
    route: '/api/users'
  }
});

requestLogger.info('Request received');
// Output: 2024-11-22 14:32:24 ◆ Request received
// Metadata: { service: 'user-service', version: '1.0.0', requestId: '123', route: '/api/users' }
```

### Custom Transports

```typescript
import { Logger, Transport, LogEntry } from '@vevkit/saga';

// Create a custom transport
class FileTransport implements Transport {
  constructor(private filepath: string) {}

  log(entry: LogEntry): void {
    // Implementation for writing to file
    const logLine = `${entry.formattedMessage}\n`;
    // Write logLine to this.filepath
  }

  // Optional cleanup method
  async close(): Promise<void> {
    // Cleanup resources
  }
}

// Use multiple transports
const logger = new Logger({
  transports: [
    new ConsoleTransport(),
    new FileTransport('./app.log')
  ]
});

// Add/remove transports dynamically
const fileTransport = new FileTransport('./errors.log');
logger.addTransport(fileTransport);
logger.removeTransport(fileTransport);
```

### Error Handling

```typescript
const logger = new Logger({
  transports: [myTransport],
  failureThreshold: 3,  // Remove transport after 3 failures
  onTransportError: (error) => {
    console.error('Transport error:', error.message);
  }
});
```

## Transport System

Saga uses a transport system to handle log output. Each transport implements the `Transport` interface:

```typescript
interface Transport {
  log(entry: LogEntry): void;
  close?(): Promise<void>;
}
```

Built-in transports:
- `ConsoleTransport`: Outputs logs to the console (default)
- `MemoryTransport`: Stores logs in memory (useful for testing)

### Creating Custom Transports

```typescript
import { Transport, LogEntry } from '@vevkit/saga';

class CustomTransport implements Transport {
  log(entry: LogEntry): void {
    // Access various properties of the log entry
    const {
      level,          // 'debug' | 'info' | 'warning' | 'success'
      message,        // The log message
      timestamp,      // Date object
      metadata,       // Additional metadata object
      formattedMessage // Pre-formatted message string
    } = entry;

    // Implement custom logging logic
  }

  // Optional cleanup method
  async close(): Promise<void> {
    // Cleanup any resources
  }
}
```

## Configuration Options

```typescript
interface LoggerConfig {
  // Log level filtering
  level?: 'debug' | 'info' | 'warning' | 'success';
  
  // Timestamp configuration
  timestamp?: TimestampPreset | {
    preset?: TimestampPreset;
    custom?: (date: Date) => string;
  };
  
  // Base metadata for all logs
  metadata?: Record<string, any>;
  
  // Transport configuration
  transports?: Transport[];
  failureThreshold?: number;
  
  // Error handling
  onTransportError?: (error: TransportError) => void;
  
  // Transport validation
  validation?: {
    throwOnInvalid?: boolean;
    requireClose?: boolean;
  };
}
```

## Log Levels

- `debug`: Detailed information for debugging
- `info`: General information about system operation
- `warning`: Potentially harmful situations
- `success`: Successful operations or positive outcomes

Each level has its own symbol in the output:
- Debug: ●
- Info: ◆
- Warning: ▼
- Success: ▲

## Best Practices

1. **Use Child Loggers**: Create child loggers for different components or request contexts:
   ```typescript
   const apiLogger = logger.child({ metadata: { component: 'api' }});
   const dbLogger = logger.child({ metadata: { component: 'database' }});
   ```

2. **Structured Metadata**: Use metadata for structured data instead of string interpolation:
   ```typescript
   // Good
   logger.info('User created', { userId: '123', email: 'user@example.com' });
   
   // Avoid
   logger.info(`User created: ${userId} with email ${email}`);
   ```

3. **Transport Error Handling**: Always configure error handling for custom transports:
   ```typescript
   const logger = new Logger({
     transports: [myTransport],
     failureThreshold: 3,
     onTransportError: (error) => {
       // Handle or report error
     }
   });
   ```

## License

MIT

## Contributing

VevKit is an organization of independent, specialized libraries. If you'd like to contribute to Saga, please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For bugs, questions, and discussions, please use the GitHub Issues.