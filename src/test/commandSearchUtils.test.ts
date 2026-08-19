import { describe, it, expect } from 'vitest';
import { filterCommands, COMMAND_LIST } from '../shared/utils/commandSearchUtils';

describe('commandSearchUtils', () => {
  it('returns all commands when query is empty', () => {
    const results = filterCommands('');
    expect(results.length).toBe(COMMAND_LIST.length);
  });

  it('filters commands by title query', () => {
    const results = filterCommands('color');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain('color');
  });

  it('filters commands by category query', () => {
    const results = filterCommands('Capture');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((c) => c.category === 'Capture')).toBe(true);
  });

  it('filters commands by shortcut query', () => {
    const results = filterCommands('Alt+Shift+I');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('tool-inspect');
  });
});
