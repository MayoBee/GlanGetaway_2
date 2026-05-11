/**
 * Unit tests for type utilities
 */

import { describe, it, expect } from 'vitest';
import { parseHotelTypes } from './typeUtils';

describe('parseHotelTypes', () => {
  it('should return empty array for null input', () => {
    expect(parseHotelTypes(null)).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(parseHotelTypes(undefined)).toEqual([]);
  });

  it('should return array as-is when input is array', () => {
    const input = ['Beach Resort', 'Seaside Resort'];
    expect(parseHotelTypes(input)).toEqual(input);
  });

  it('should parse JSON string array correctly', () => {
    const input = '["Beach Resort","Seaside Resort"]';
    const result = parseHotelTypes(input);
    expect(result).toEqual(['Beach Resort', 'Seaside Resort']);
  });

  it('should treat single string as array with one element', () => {
    const input = 'Beach Resort';
    const result = parseHotelTypes(input);
    expect(result).toEqual(['Beach Resort']);
  });

  it('should return empty array for invalid JSON string', () => {
    const input = '{invalid json}';
    const result = parseHotelTypes(input);
    expect(result).toEqual(['{invalid json}']);
  });

  it('should handle empty array', () => {
    const input = [];
    expect(parseHotelTypes(input)).toEqual([]);
  });

  it('should handle empty string', () => {
    const input = '';
    expect(parseHotelTypes(input)).toEqual(['']);
  });
});
