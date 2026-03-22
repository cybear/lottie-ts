/**
 * Unit tests for src/utils/markers/markerParser.ts
 * Pure Node — no DOM needed.
 */
import { describe, it, expect } from 'vitest';
import markerParser from '../../../src/utils/markers/markerParser';

describe('markerParser', () => {
  it('returns an empty array for empty input', () => {
    expect(markerParser([])).toEqual([]);
  });

  it('maps tm and dr to time and duration', () => {
    const result = markerParser([{ tm: 10, dr: 5 }]);
    expect(result[0].time).toBe(10);
    expect(result[0].duration).toBe(5);
  });

  it('parses a JSON payload from cm field', () => {
    const result = markerParser([{ tm: 0, dr: 1, cm: '{"name":"intro","loop":true}' }]);
    expect(result[0].payload).toEqual({ name: 'intro', loop: true });
  });

  it('parses key:value text payload (\\r\\n separated)', () => {
    const result = markerParser([{ tm: 0, dr: 1, cm: 'name:section_start\r\nloop:false' }]);
    expect(result[0].payload).toMatchObject({ name: 'section_start', loop: 'false' });
  });

  it('falls back to { name: cm } when cm is plain text with no colon pairs', () => {
    const result = markerParser([{ tm: 0, dr: 1, cm: 'my_segment' }]);
    expect(result[0].payload).toEqual({ name: 'my_segment' });
  });

  it('handles missing cm field by setting payload to { name: undefined }', () => {
    const result = markerParser([{ tm: 0, dr: 2 }]);
    expect(result[0].payload).toBeDefined();
  });

  it('handles multiple markers preserving order', () => {
    const result = markerParser([
      { tm: 0, dr: 10, cm: '{"id":1}' },
      { tm: 10, dr: 5, cm: '{"id":2}' },
      { tm: 15, dr: 20, cm: '{"id":3}' },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0].payload.id).toBe(1);
    expect(result[1].payload.id).toBe(2);
    expect(result[2].payload.id).toBe(3);
  });

  it('preserves time and duration for each marker', () => {
    const result = markerParser([
      { tm: 5, dr: 15, cm: 'intro' },
      { tm: 20, dr: 30, cm: 'outro' },
    ]);
    expect(result[0].time).toBe(5);
    expect(result[0].duration).toBe(15);
    expect(result[1].time).toBe(20);
    expect(result[1].duration).toBe(30);
  });

  it('parses numeric JSON values', () => {
    const result = markerParser([{ tm: 0, dr: 1, cm: '{"start":0,"end":100}' }]);
    expect(result[0].payload.start).toBe(0);
    expect(result[0].payload.end).toBe(100);
  });
});
