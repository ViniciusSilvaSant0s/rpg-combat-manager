import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

const identity = { uid: 'firebase-123', email_verified: true, email: 'hero@example.com', name: 'Hero' };
function setup() {
  const verify = vi.fn().mockResolvedValue(identity);
  const profiles = { find: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn() };
  return { app: createApp({ verify, profiles }), verify, profiles };
}

describe('profile API', () => {
  it('rejects missing, invalid and unverified credentials', async () => {
    const { app, verify } = setup();
    expect((await request(app).get('/profile')).status).toBe(401);
    verify.mockRejectedValueOnce(new Error('invalid'));
    expect((await request(app).get('/profile').set('Authorization', 'Bearer invalid')).status).toBe(401);
    verify.mockResolvedValueOnce({ ...identity, email_verified: false, firebase: { sign_in_provider: 'password' } });
    expect((await request(app).get('/profile').set('Authorization', 'Bearer token')).status).toBe(403);
  });
  it('requires a complete profile and validates data', async () => {
    const { app } = setup();
    expect((await request(app).get('/profile').set('Authorization', 'Bearer token')).status).toBe(404);
    const response = await request(app).post('/profile').set('Authorization', 'Bearer token').send({ nickname: 'a!', birthDate: '3020-01-01' });
    expect(response.status).toBe(400);
  });
  it('creates a profile using the verified identity', async () => {
    const { app, profiles } = setup();
    profiles.create.mockResolvedValue({ id: 1, nickname: 'Hero_1', birthDate: '2000-01-01' });
    const response = await request(app).post('/profile').set('Authorization', 'Bearer token').send({ uid: 'attacker', nickname: 'Hero_1', birthDate: '2000-01-01' });
    expect(response.status).toBe(201);
    expect(profiles.create.mock.calls[0][0].uid).toBe('firebase-123');
  });
  it('returns a conflict for an unavailable nickname', async () => {
    const { app, profiles } = setup();
    profiles.create.mockRejectedValue(Object.assign(new Error('conflict'), { code: 'PROFILE_CONFLICT' }));
    expect((await request(app).post('/profile').set('Authorization', 'Bearer token').send({ nickname: 'Hero_1', birthDate: '2000-01-01' })).status).toBe(409);
  });
});

  it('updates only the authenticated user and reports a missing profile', async () => {
    const { app, profiles } = setup();
    profiles.update.mockResolvedValueOnce(null);
    const response = await request(app).put('/profile').set('Authorization', 'Bearer token').send({ uid: 'someone-else', nickname: 'Updated_1', birthDate: '2001-05-06' });
    expect(response.status).toBe(404);
    expect(profiles.update.mock.calls[0][0].uid).toBe('firebase-123');
  });

describe('profile responses', () => {
  it('rejects invalid input without calling persistence', async () => {
    const { app, profiles } = setup();
    const response = await request(app).post('/profile').set('Authorization', 'Bearer token').send({ nickname: 'bad!', birthDate: '2000-01-01' });
    expect(response.status).toBe(400);
    expect(profiles.create).not.toHaveBeenCalled();
  });
  it('does not expose persistence errors', async () => {
    const { app, profiles } = setup();
    profiles.find.mockRejectedValue(new Error('private database details'));
    const response = await request(app).get('/profile').set('Authorization', 'Bearer token');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Não foi possível acessar o perfil.' });
  });
  it('returns the updated profile for the authenticated user', async () => {
    const { app, profiles } = setup();
    profiles.update.mockResolvedValue({ id: 1, nickname: 'Updated_1', birthDate: '2001-05-06' });
    const response = await request(app).put('/profile').set('Authorization', 'Bearer token').send({ nickname: 'Updated_1', birthDate: '2001-05-06' });
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('Updated_1');
    expect(profiles.update.mock.calls[0][0].uid).toBe(identity.uid);
  });
});

it('prevents caching of authenticated profile responses', async () => {
  const { app, profiles } = setup();
  profiles.find.mockResolvedValue({ id: 1, nickname: 'Hero_1', birthDate: '2000-01-01' });
  const response = await request(app).get('/profile').set('Authorization', 'Bearer token');
  expect(response.status).toBe(200);
  expect(response.headers['cache-control']).toContain('no-store');
});
