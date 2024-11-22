# @vevkit/saga

> A functional, composable logging library for JavaScript/TypeScript applications

Part of the [VevKit](https://github.com/vevkit) ecosystem, `@vevkit/saga` provides a lightweight, pattern-based logging system that emphasizes composition and clean interfaces.

## Features

- 🧬 Functional, immutable design
- 🎨 Nordic-inspired status indicators (▲ ▼ ◆ ●)
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

// Basic logging
logger.success('Operation completed');  // ▲ Operation completed
logger.warning('Resource running low'); // ▼ Resource running low
logger.info('Processing request');      // ◆ Processing request
logger.debug('Cache miss');            // ● Cache miss

// Add metadata
logger.info('User action', { userId: '123', action: 'login' });

// Create specialized logger
const apiLogger = logger.child({
  metadata: { service: 'api' }
});

apiLogger.warning('Rate limit approaching');
```

## Configuration

```typescript
interface LoggerConfig {
  level?: 'success' | 'warning' | 'info' | 'debug';
  pattern?: string;
  metadata?: Record<string, any>;
  formatters?: {
    timestamp?: (date: Date) => string;
    message?: (entry: LogEntry) => string;
  };
}
```

## Patterns

Customize log message formatting using patterns:

```typescript
const logger = createLogger({
  pattern: '[{timestamp}] {level} {message}'
});

// Create child loggers with additional context
const dbLogger = logger.child({
  metadata: { component: 'database' },
  pattern: '[{component}] {message}'
});
```

## API Reference

### Core Functions

- `createLogger(config?: LoggerConfig): Logger`
- `logger.success(message: string, metadata?: Record<string, any>): void`
- `logger.warning(message: string, metadata?: Record<string, any>): void`
- `logger.info(message: string, metadata?: Record<string, any>): void`
- `logger.debug(message: string, metadata?: Record<string, any>): void`

### Composition Methods

- `logger.child(config: Partial<LoggerConfig>): Logger`
- `logger.withMetadata(metadata: Record<string, any>): Logger`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [VevKit](https://github.com/vevkit)