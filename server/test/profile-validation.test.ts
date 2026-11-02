import { describe, expect, it } from 'vitest';
import { validProfile } from '../src/controllers/profile.js';
describe('profile validation', () => {
  it('rejects impossible, future and non-calendar dates', () => {
    for (const birthDate of ['2023-02-29', '9999-01-01', '0000-01-01', '2000-1-1']) {
      expect(validProfile({ nickname: 'Hero_1', birthDate })).toBe(false);
    }
  });
  it('accepts a leap day and valid ASCII nickname', () => {
    expect(validProfile({ nickname: 'Hero_1', birthDate: '2000-02-29' })).toBe(true);
  });
});
