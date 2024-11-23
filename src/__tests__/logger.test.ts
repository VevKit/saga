import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../logger';
import { LOG_SYMBOLS } from '../constants';
import type { LoggerConfig } from '../types';

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
});