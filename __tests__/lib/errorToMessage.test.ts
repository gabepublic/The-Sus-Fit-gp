import { errorToMessage } from '../../src/lib/errorToMessage';

describe('errorToMessage', () => {
  it('returns correct message for 400 status', () => {
    expect(errorToMessage(400)).toBe('Invalid images uploaded.');
  });

  it('returns correct message for 429 status', () => {
    expect(errorToMessage(429)).toBe('OpenAI rate limit reached, try later.');
  });

  it('returns correct message for TIMEOUT string', () => {
    expect(errorToMessage('TIMEOUT')).toBe('Request timed out, please retry.');
  });

  it('returns correct message for 500 status', () => {
    expect(errorToMessage(500)).toBe('Server error, please try again.');
  });

  it('returns correct message for 503 status', () => {
    expect(errorToMessage(503)).toBe('Service temporarily unavailable.');
  });

  it('returns default message for unknown status', () => {
    expect(errorToMessage(404)).toBe('Unexpected error, please retry.');
    expect(errorToMessage(502)).toBe('Unexpected error, please retry.');
    expect(errorToMessage('UNKNOWN')).toBe('Unexpected error, please retry.');
  });

  it('returns default message for undefined status', () => {
    expect(errorToMessage(undefined)).toBe('Unexpected error, please retry.');
  });

  it('returns default message for null status', () => {
    expect(errorToMessage(null as any)).toBe('Unexpected error, please retry.');
  });

  it('handles string numbers correctly', () => {
    expect(errorToMessage('400')).toBe('Invalid images uploaded.');
    expect(errorToMessage('429')).toBe('OpenAI rate limit reached, try later.');
    expect(errorToMessage('500')).toBe('Server error, please try again.');
  });
});
