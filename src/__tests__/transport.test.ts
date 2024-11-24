import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../logger';
import { ConsoleTransport } from '../transports/base';
import { MemoryTransport } from '../transports/memory';
import type { LoggerConfig } from '../types';

test('Transport system', async (t) => {
  await t.test('handles multiple transports consistently', () => {
    const memory1 = new MemoryTransport();
    const memory2 = new MemoryTransport();
    const logger = new Logger({ 
      transports: [memory1, memory2],
      timestamp: 'short'
    });

    logger.info('Test message');

    const log1 = memory1.getLastLog();
    const log2 = memory2.getLastLog();
    
    assert.equal(log1?.formattedMessage, log2?.formattedMessage);
    assert.match(log1!.formattedMessage!, /^\d{2}:\d{2}:\d{2} ◆/);
  });

  await t.test('maintains transport independence', () => {
    const memory1 = new MemoryTransport();
    const memory2 = new MemoryTransport();
    const logger = new Logger({ transports: [memory1, memory2] });

    logger.info('First message');
    logger.removeTransport(memory2);
    logger.info('Second message');

    assert.equal(memory1.getLogs().length, 2);
    assert.equal(memory2.getLogs().length, 1);
  });

  await t.test('transport management', async (t) => {
    await t.test('verifies transport addition and removal', () => {
      const logger = new Logger();
      const memory = new MemoryTransport();

      assert.equal(logger.getTransports().length, 1);
      assert.ok(logger.getTransports()[0] instanceof ConsoleTransport);

      logger.addTransport(memory);
      assert.equal(logger.getTransports().length, 2);

      logger.removeTransport(memory);
      assert.equal(logger.getTransports().length, 1);

      logger.clearTransports();
      assert.equal(logger.getTransports().length, 0);
    });

    await t.test('maintains transport array independence', () => {
      const logger = new Logger();
      const transports = logger.getTransports();
      const originalLength = transports.length;
      
      transports.push(new MemoryTransport());
      assert.equal(logger.getTransports().length, originalLength);
    });
  });

  await t.test('metadata handling', async (t) => {
    await t.test('preserves metadata across transports', () => {
      const memory = new MemoryTransport();
      const logger = new Logger({
        transports: [memory],
        metadata: { service: 'test-service' }
      });

      logger.info('Basic metadata');
      assert.equal(memory.getLastLog()?.metadata?.service, 'test-service');

      logger.info('With extra metadata', { requestId: '123' });
      const lastLog = memory.getLastLog();
      assert.equal(lastLog?.metadata?.service, 'test-service');
      assert.equal(lastLog?.metadata?.requestId, '123');
    });

    await t.test('handles metadata in child loggers', () => {
      const memory = new MemoryTransport();
      const logger = new Logger({
        transports: [memory],
        metadata: { service: 'test-service' }
      });

      const childLogger = logger.child({ 
        metadata: { component: 'test-component' }
      });
      childLogger.info('Child logger');
      
      const childLog = memory.getLastLog();
      assert.equal(childLog?.metadata?.service, 'test-service');
      assert.equal(childLog?.metadata?.component, 'test-component');
    });
  });

  await t.test('formatting consistency', () => {
    const memory = new MemoryTransport();
    const timestampConfigs: Array<[string, LoggerConfig]> = [
      ['short', { timestamp: 'short' }],
      ['time', { timestamp: 'time' }],
      ['date', { timestamp: 'date' }],
      ['none', { timestamp: 'none' }],
      ['custom', { 
        timestamp: { 
          custom: (date: Date) => `[TEST]` 
        }
      }]
    ];

    timestampConfigs.forEach(([name, config]) => {
      memory.clear();
      const logger = new Logger({ ...config, transports: [memory] });
      logger.info('Test message');
      
      const log = memory.getLastLog();
      switch (name) {
        case 'short':
          assert.match(log!.formattedMessage!, /^\d{2}:\d{2}:\d{2} ◆/);
          break;
        case 'time':
          assert.match(log!.formattedMessage!, /^\d{2}:\d{2}:\d{2}\.\d{3} ◆/);
          break;
        case 'date':
          assert.match(log!.formattedMessage!, /^\d{4}-\d{2}-\d{2} ◆/);
          break;
        case 'none':
          assert.match(log!.formattedMessage!, /^◆/);
          break;
        case 'custom':
          assert.match(log!.formattedMessage!, /^\[TEST\] ◆/);
          break;
      }
    });
  });
});