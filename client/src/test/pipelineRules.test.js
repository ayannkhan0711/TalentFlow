import { describe, it, expect } from 'vitest';
import { isValidTransition, ALLOWED_TRANSITIONS } from '../utils/pipelineRules';

describe('Client Pipeline Rules Validation', () => {
  it('allows valid forward moves', () => {
    expect(isValidTransition('Applied', 'Screening')).toBe(true);
    expect(isValidTransition('Applied', 'Rejected')).toBe(true);
    expect(isValidTransition('Screening', 'Interview')).toBe(true);
    expect(isValidTransition('Interview', 'Offer')).toBe(true);
    expect(isValidTransition('Offer', 'Hired')).toBe(true);
  });

  it('blocks skipped stages', () => {
    expect(isValidTransition('Applied', 'Interview')).toBe(false);
    expect(isValidTransition('Applied', 'Offer')).toBe(false);
    expect(isValidTransition('Applied', 'Hired')).toBe(false);
    expect(isValidTransition('Screening', 'Hired')).toBe(false);
  });

  it('blocks same-stage drops', () => {
    expect(isValidTransition('Applied', 'Applied')).toBe(false);
    expect(isValidTransition('Screening', 'Screening')).toBe(false);
    expect(isValidTransition('Hired', 'Hired')).toBe(false);
  });

  it('blocks moves out of terminal stages (Hired / Rejected)', () => {
    expect(isValidTransition('Hired', 'Offer')).toBe(false);
    expect(isValidTransition('Hired', 'Rejected')).toBe(false);
    expect(isValidTransition('Rejected', 'Applied')).toBe(false);
    expect(isValidTransition('Rejected', 'Screening')).toBe(false);
  });
});
