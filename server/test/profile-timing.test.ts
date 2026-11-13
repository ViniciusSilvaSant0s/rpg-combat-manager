import request from 'supertest';
import { expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

it('logs a correlated profile request and authentication timing without credentials', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubEnv('PROFILE_TIMING', '1');
  try {
    const app = createApp({ verify: vi.fn().mockResolvedValue({ uid: 'private-user', email_verified: true }), profiles: { find: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn() } });
    await request(app).get('/profile').set('Authorization', 'Bearer private-token');
    const lines = log.mock.calls.map(call => call.join(' ')).join('\n');
    expect(lines).toContain('[PROFILE-TIMING]');
    expect(lines).toContain('auth.verify');
    expect(lines).toContain('request.total');
    expect(lines).not.toContain('private-token');
    expect(lines).not.toContain('private-user');
  } finally { log.mockRestore(); vi.unstubAllEnvs(); }
});
