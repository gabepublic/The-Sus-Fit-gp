import { describe, test, expect } from '@jest/globals';

/**
 * Sample test to verify testing framework setup
 * This test ensures Jest, React Testing Library, and coverage are working correctly
 */

describe('Testing Framework Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  test('Coverage calculation is working', () => {
    const sampleFunction = (a: number, b: number): number => {
      if (a > b) {
        return a + b;
      } else {
        return a - b;
      }
    };

    expect(sampleFunction(5, 3)).toBe(8);
    expect(sampleFunction(3, 5)).toBe(-2);
  });

  test('Async operations work', async () => {
    const asyncFunction = async (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('async result'), 10);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });
}); 