import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../logger';
import { ConsoleTransport, Transport } from '../transports/base';
import { MemoryTransport } from '../transports/memory';
import { TransportValidationError, type LoggerConfig, type TransportError } from '../types';

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

  await t.test('error handling', async (t) => {
    await t.test('handles transport failures without breaking other transports', () => {
      const memory1 = new MemoryTransport();
      const failingTransport = new class implements Transport {
        log() { throw new Error('Transport failure'); }
      };
      const memory2 = new MemoryTransport();
  
      const errors: TransportError[] = [];
      const logger = new Logger({
        transports: [memory1, failingTransport, memory2],
        onTransportError: (error) => {
          errors.push(error);
        }
      });
  
      logger.info('Test message');
  
      assert.equal(memory1.getLogs().length, 1, 'First transport should receive log');
      assert.equal(memory2.getLogs().length, 1, 'Third transport should receive log');
      assert.equal(errors.length, 1, 'Error handler should be called once');
      assert.equal(errors[0].error.message, 'Transport failure');
    });
  
    await t.test('removes transport after reaching failure threshold', () => {
      const failingTransport = new class implements Transport {
        log() { throw new Error('Transport failure'); }
      };
  
      const errors: TransportError[] = [];
      const logger = new Logger({
        transports: [failingTransport],
        failureThreshold: 3,
        onTransportError: (error) => {
          errors.push(error);
        }
      });
  
      // Trigger failures
      for (let i = 0; i < 4; i++) {
        logger.info(`Message ${i}`);
      }
  
      assert.equal(errors.length, 3, 'Should record three failures before removal');
      assert.equal(logger.getTransports().length, 1, 'Should have fallback console transport');
      assert.ok(logger.getTransports()[0] instanceof ConsoleTransport, 'Should fall back to console transport');
    });
  
    await t.test('resets failure count after successful log', () => {
      let shouldFail = true;
      const intermittentTransport = new class implements Transport {
        log() { 
          if (shouldFail) throw new Error('Transport failure');
        }
      };
  
      const logger = new Logger({
        transports: [intermittentTransport],
        failureThreshold: 3
      });
  
      // Two failures
      logger.info('Message 1');
      logger.info('Message 2');
  
      // Successful log
      shouldFail = false;
      logger.info('Message 3');
  
      // Check transport status
      const status = logger.getTransportStatus();
      assert.equal(status[0].failures, 0, 'Failure count should reset after success');
  
      // Another failure
      shouldFail = true;
      logger.info('Message 4');
      
      // Transport should still be present as it hasn't hit threshold since reset
      assert.equal(logger.getTransports().length, 1);
      assert.equal(logger.getTransportStatus()[0].failures, 1);
    });
  
    // await t.test('maintains transport independence during failures', () => {
    //   const memory1 = new MemoryTransport();
    //   const failingTransport = new class implements Transport {
    //     log() { throw new Error('Transport failure'); }
    //   };
    //   const memory2 = new MemoryTransport();
  
    //   const logger = new Logger({
    //     transports: [memory1, failingTransport, memory2],
    //     failureThreshold: 2
    //   });
  
    //   // Multiple log attempts
    //   logger.info('Message 1');
    //   logger.info('Message 2');
    //   logger.info('Message 3');
  
    //   // Check both working transports received all logs
    //   assert.equal(memory1.getLogs().length, 3);
    //   assert.equal(memory2.getLogs().length, 3);
      
    //   // Failing transport should be removed after threshold
    //   assert.equal(logger.getTransports().length, 2);
    // });
  });
  await t.test('transport validation', async (t) => {
    await t.test('validates transport implementation', () => {
      const logger = new Logger({
        validation: { throwOnInvalid: true }
      });
    
      // Invalid transport - not an object
      assert.throws(
        () => logger.addTransport(null as any),
        {
          name: 'TransportValidationError',
          message: 'Transport must be an object'
        }
      );
    
      // Invalid transport - missing log method
      assert.throws(
        () => logger.addTransport({} as any),
        {
          name: 'TransportValidationError',
          message: 'Transport must implement log() method'
        }
      );
    
      // Invalid transport - log is not a function
      assert.throws(
        () => logger.addTransport({ log: 'not a function' } as any),
        {
          name: 'TransportValidationError',
          message: 'Transport must implement log() method'
        }
      );
    
      // Valid transport
      const validTransport = new MemoryTransport();
      assert.doesNotThrow(() => logger.addTransport(validTransport));
    });
  
    await t.test('handles validation modes properly', () => {
      // Test warning mode
      const logger = new Logger({
        validation: { throwOnInvalid: false }
      });
  
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (message: string) => {
        warnings.push(message);
      };
  
      logger.addTransport({} as any);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /Transport validation warning/);
  
      console.warn = originalWarn;
    });
  
    await t.test('validates optional close method when required', () => {
      const logger = new Logger({
        validation: { 
          throwOnInvalid: true,
          requireClose: true
        }
      });
  
      const transportWithoutClose = {
        log: () => {}
      };
  
      assert.throws(
        () => logger.addTransport(transportWithoutClose as Transport),
        /must implement close\(\) method/
      );
  
      const transportWithClose = {
        log: () => {},
        close: async () => {}
      };
  
      assert.doesNotThrow(() => logger.addTransport(transportWithClose));
    });
  
    await t.test('validates initial transports from config', () => {
      const invalidTransport = {} as Transport;
      const validTransport = new MemoryTransport();
    
      // With throwOnInvalid: false, should filter out invalid transports
      const logger1 = new Logger({
        transports: [invalidTransport, validTransport],
        validation: { throwOnInvalid: false }
      });
    
      assert.equal(logger1.getTransports().length, 1);
    
      // With throwOnInvalid: true, should throw
      assert.throws(
        () => new Logger({
          transports: [invalidTransport, validTransport],
          validation: { throwOnInvalid: true }
        }),
        {
          name: 'TransportValidationError',
          message: 'Transport must implement log() method'
        }
      );
    });
  
    await t.test('falls back to console transport when all transports are invalid', () => {
      const logger = new Logger({
        transports: [{} as Transport],
        validation: { throwOnInvalid: false }
      });
  
      assert.equal(logger.getTransports().length, 1);
      assert.ok(logger.getTransports()[0] instanceof ConsoleTransport);
    });
  });
});