import { describe, it, expect } from 'vitest';
import { parseOrigins } from '../src/utils/config.js';

describe('parseOrigins', () => {
  it('splits a comma-separated list', () => {
    expect(parseOrigins('http://localhost:5173,https://example.com')).toEqual([
      'http://localhost:5173',
      'https://example.com',
    ]);
  });

  it('strips quotes pasted into a host env UI', () => {
    expect(parseOrigins('"http://localhost:5173,https://example.com"')).toEqual([
      'http://localhost:5173',
      'https://example.com',
    ]);
  });

  it('drops trailing slashes, paths and spaces', () => {
    expect(parseOrigins(' https://example.com/ , https://www.example.com/shop ')).toEqual([
      'https://example.com',
      'https://www.example.com',
    ]);
  });

  it('skips invalid entries and empty values', () => {
    expect(parseOrigins('example.com,,https://ok.example')).toEqual(['https://ok.example']);
    expect(parseOrigins(undefined)).toEqual([]);
  });
});
