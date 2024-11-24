import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../logger';
import { LOG_SYMBOLS } from '../constants';
import { MemoryTransport } from '../transports/memory';
import type { LogEntry } from '../types';

test('Logger Class Implementation', async (t) => {
  // Store console.log calls
  const logs: string[] = [];
  const originalConsoleLog = console.log;
  console.log = (message: string) => {
    logs.push(message);
  };

  // Cleanup after tests
  t.after(() => {
    console.log = originalConsoleLog;
  });

  await t.test('basic logging functionality', async (t) => {
    await t.test('logs messages with correct level symbols', () => {
      const logger = new Logger({ level: 'debug' });

      logger.success('Success message');
      assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.success}.*Success message`));

      logger.warning('Warning message');
      assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.warning}.*Warning message`));

      logger.info('Info message');
      assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.info}.*Info message`));

      logger.debug('Debug message');
      assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.debug}.*Debug message`));
    });

    await t.test('respects log levels', () => {
      logs.length = 0; // Clear logs array
      
      const infoLogger = new Logger({ level: 'info' });
      
      infoLogger.debug('Debug message'); // Should not be logged
      assert.equal(logs.length, 0, 'Debug message should not be logged when level is info');
      
      infoLogger.info('Info message'); // Should be logged
      assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.info}.*Info message`));
      
      infoLogger.warning('Warning message'); // Should be logged
      assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.warning}.*Warning message`));
    });
  });

  await t.test('timestamp formatting', async (t) => {
    await t.test('supports different timestamp presets', () => {
      logs.length = 0;

      // Short time format
      const shortLogger = new Logger({ timestamp: 'short' });
      shortLogger.info('Short time message');
      assert.match(logs[logs.length - 1], /^\d{2}:\d{2}:\d{2} ◆/);

      // Date only format
      const dateLogger = new Logger({ timestamp: 'date' });
      dateLogger.info('Date message');
      assert.match(logs[logs.length - 1], /^\d{4}-\d{2}-\d{2} ◆/);

      // Custom format
      const customLogger = new Logger({
        timestamp: {
          custom: (date) => `[${date.getHours()}h]`
        }
      });
      customLogger.info('Custom time message');
      assert.match(logs[logs.length - 1], /^\[\d{1,2}h\] ◆/);
    });
  });

  await t.test('transport management', async (t) => {
    await t.test('supports multiple transports', () => {
      const memory1 = new MemoryTransport();
      const memory2 = new MemoryTransport();
      const logger = new Logger({ transports: [memory1, memory2] });

      logger.info('Test message');

      assert.equal(memory1.getLogs().length, 1);
      assert.equal(memory2.getLogs().length, 1);
    });

    await t.test('can add and remove transports', () => {
      const memory = new MemoryTransport();
      const logger = new Logger();
      
      logger.addTransport(memory);
      logger.info('Test message 1');
      assert.equal(memory.getLogs().length, 1);

      logger.removeTransport(memory);
      logger.info('Test message 2');
      assert.equal(memory.getLogs().length, 1); // Still 1, not 2
    });

    await t.test('can clear all transports', () => {
      const memory = new MemoryTransport();
      const logger = new Logger({ transports: [memory] });

      logger.clearTransports();
      logger.info('Test message');
      assert.equal(memory.getLogs().length, 0);
    });

    await t.test('maintains metadata in transports', () => {
      const memory = new MemoryTransport();
      const logger = new Logger({ 
        transports: [memory],
        metadata: { service: 'test' }
      });

      logger.info('Test message', { requestId: '123' });
      
      const lastLog = memory.getLastLog();
      assert.equal(lastLog?.metadata?.service, 'test');
      assert.equal(lastLog?.metadata?.requestId, '123');
    });
  });

  await t.test('child loggers', async (t) => {
    logs.length = 0;

    const parentLogger = new Logger({
      metadata: { service: 'main' }
    });

    const childLogger = parentLogger.child({
      metadata: { component: 'auth' }
    });

    // Child should inherit parent metadata
    assert.deepEqual(
      childLogger.getConfig().metadata,
      { service: 'main', component: 'auth' }
    );

    // Child should maintain its own config
    const childConfig = childLogger.getConfig();
    assert.deepEqual(childConfig.metadata, { service: 'main', component: 'auth' });

    // Parent should remain unchanged
    const parentConfig = parentLogger.getConfig();
    assert.deepEqual(parentConfig.metadata, { service: 'main' });
  });

  await t.test('static create method', () => {
    const logger = Logger.create({ level: 'debug' });
    assert.ok(logger instanceof Logger);
    assert.equal(logger.getConfig().level, 'debug');
  });
});