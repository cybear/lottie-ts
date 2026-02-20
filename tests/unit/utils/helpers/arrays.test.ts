/**
 * Unit tests for src/utils/helpers/arrays.ts
 * Pure Node — no DOM needed.
 */
import { describe, it, expect } from 'vitest';
import { createTypedArray, createSizedArray } from '../../../../src/utils/helpers/arrays';

describe('createSizedArray', () => {
  it('returns an array of the requested length', () => {
    const arr = createSizedArray(5);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toHaveLength(5);
  });

  it('returns an empty array for length 0', () => {
    expect(createSizedArray(0)).toHaveLength(0);
  });

  it('handles large sizes without throwing', () => {
    const arr = createSizedArray(10000);
    expect(arr).toHaveLength(10000);
  });
});

describe('createTypedArray', () => {
  it('creates a Float32Array for "float32"', () => {
    const arr = createTypedArray('float32', 4);
    expect(arr).toBeInstanceOf(Float32Array);
    expect(arr).toHaveLength(4);
  });

  it('creates an Int16Array for "int16"', () => {
    const arr = createTypedArray('int16', 3);
    expect(arr).toBeInstanceOf(Int16Array);
    expect(arr).toHaveLength(3);
  });

  it('creates a Uint8ClampedArray for "uint8c"', () => {
    const arr = createTypedArray('uint8c', 6);
    expect(arr).toBeInstanceOf(Uint8ClampedArray);
    expect(arr).toHaveLength(6);
  });

  it('creates a plain array for unknown types', () => {
    const arr = createTypedArray('generic', 3);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toHaveLength(3);
  });

  it('float32 array is initialised to zeros', () => {
    const arr = createTypedArray('float32', 3) as Float32Array;
    expect(Array.from(arr)).toEqual([0, 0, 0]);
  });

  it('int16 array is initialised to zeros', () => {
    const arr = createTypedArray('int16', 3) as Int16Array;
    expect(Array.from(arr)).toEqual([0, 0, 0]);
  });

  it('handles length 0', () => {
    const arr = createTypedArray('float32', 0);
    expect(arr).toHaveLength(0);
  });
});
