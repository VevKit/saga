import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLogger } from '../core';
import { LOG_SYMBOLS } from '../constants';
import type { Logger } from '../types';

test('Basic logging functionality', async (t) => {
  // Store console.log calls
  const logs: string[] = [];
  const originalConsoleLog = console.log;
  console.log = (message: string) => {
    logs.push(message);
  };

  await t.test('logs messages with correct level symbols', () => {
    const logger = createLogger({ level: 'debug' });

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
    
    const infoLogger = createLogger({ level: 'info' });
    
    infoLogger.debug('Debug message'); // Should not be logged
    assert.equal(logs.length, 0, 'Debug message should not be logged when level is info');
    
    infoLogger.info('Info message'); // Should be logged
    assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.info}.*Info message`));
    
    infoLogger.warning('Warning message'); // Should be logged
    assert.match(logs[logs.length - 1], new RegExp(`.*${LOG_SYMBOLS.warning}.*Warning message`));
  });
});

test('timestamp formatting options', async (t) => {
  const logs: string[] = [];
  const originalConsoleLog = console.log;
  console.log = (message: string) => {
    logs.push(message);
  };

  await t.test('supports different timestamp presets', () => {
    // Short time format
    const shortLogger = createLogger({ timestamp: 'short' });
    shortLogger.info('Short time message');
    assert.match(logs[logs.length - 1], /^\d{2}:\d{2}:\d{2} ◆/);

    // Date only format
    const dateLogger = createLogger({ timestamp: 'date' });
    dateLogger.info('Date message');
    assert.match(logs[logs.length - 1], /^\d{4}-\d{2}-\d{2} ◆/);

    // No timestamp
    const noTimeLogger = createLogger({ timestamp: 'none' });
    noTimeLogger.info('No time message');
    assert.match(logs[logs.length - 1], /^◆ No time message$/);

    // Custom format
    const customLogger = createLogger({
      timestamp: {
        custom: (date) => `[${date.getHours()}h]`
      }
    });
    customLogger.info('Custom time message');
    assert.match(logs[logs.length - 1], /^\[\d{1,2}h\] ◆/);
  });

  console.log = originalConsoleLog;
});