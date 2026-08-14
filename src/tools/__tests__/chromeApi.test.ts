import {describe, expect, it, vi} from 'vitest';

import {asyncResponse, throwIfResponseError} from '../chromeApi';

describe('background response errors', () => {
  it('returns rejected operation errors to the sender', async () => {
    const sendResponse = vi.fn();

    expect(
      asyncResponse(sendResponse, async () => Promise.reject(new Error('Cannot apply proxy'))),
    ).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({error: 'Cannot apply proxy'});
    });
  });

  it('throws a returned error in the UI context', () => {
    expect(() => throwIfResponseError({error: 'Cannot apply proxy'})).toThrow('Cannot apply proxy');
  });
});
