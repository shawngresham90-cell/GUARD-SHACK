import { describe, it, expect } from 'vitest';
import { deriveCohort } from './cohort';

describe('deriveCohort', () => {
  it('maps the stan_store source to day1_stan (warm funnel)', () => {
    expect(deriveCohort('stan_store')).toBe('day1_stan');
  });

  it('maps any other known source to cold_youtube', () => {
    expect(deriveCohort('youtube')).toBe('cold_youtube');
    expect(deriveCohort('google')).toBe('cold_youtube');
    expect(deriveCohort('newsletter')).toBe('cold_youtube');
  });

  it('treats absent UTM (null/undefined/empty) as cold_youtube', () => {
    expect(deriveCohort(null)).toBe('cold_youtube');
    expect(deriveCohort(undefined)).toBe('cold_youtube');
    expect(deriveCohort('')).toBe('cold_youtube');
  });

  it('is case-sensitive — only the exact "stan_store" token is the warm cohort', () => {
    expect(deriveCohort('Stan_Store')).toBe('cold_youtube');
    expect(deriveCohort('STAN_STORE')).toBe('cold_youtube');
  });
});
