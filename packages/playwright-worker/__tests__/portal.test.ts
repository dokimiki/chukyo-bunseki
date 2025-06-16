import { test, expect, describe } from 'bun:test';
import { ChkyuoPortalWorker, createPortalWorker } from '../src/portal.js';
import { ChkyuoAutomationWorker } from '../src/automation.js';

// Simple stub result for navigateTo
const successResult = { success: true, message: 'ok' };

describe('Portal Worker goToPortalTop', () => {
  test('should call navigateTo with portal URL', async () => {
    const worker = new ChkyuoPortalWorker();
    let calledUrl: string | null = null;
    // @ts-ignore override navigateTo for testing
    worker.navigateTo = async (url: string) => {
      calledUrl = url;
      return successResult as any;
    };

    const result = await worker.goToPortalTop();
    expect(calledUrl).toBe('https://manabo.cnc.chukyo-u.ac.jp');
    expect(result).toEqual(successResult);
  });
});

describe('createPortalWorker', () => {
  test('should initialize and return portal worker instance', async () => {
    let initCalled = false;
    const originalInit = ChkyuoPortalWorker.prototype.initialize;
    // @ts-ignore override initialize to avoid real browser
    ChkyuoPortalWorker.prototype.initialize = async function () {
      initCalled = true;
    };

    const worker = await createPortalWorker();
    expect(initCalled).toBe(true);
    expect(worker).toBeInstanceOf(ChkyuoPortalWorker);
    expect(worker).toBeInstanceOf(ChkyuoAutomationWorker);

    ChkyuoPortalWorker.prototype.initialize = originalInit;
  });
});
