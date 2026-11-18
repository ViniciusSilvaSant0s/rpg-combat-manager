import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('combats API', () => {
  it('requires authentication, validates titles and isolates users', async () => {
    const records = new Map<string, any[]>();
    const combats = {
      list: async (identity: any) => records.get(identity.uid) ?? [],
      create: async (identity: any, title: string, description: string | null) => {
        const combat = { id: 1, title, description, started: false, currentParticipantId: null, version: 1, participants: [] };
        records.set(identity.uid, [combat]); return combat;
      },
    };
    const app = createApp({ verify: async token => ({ uid: token }), profiles: {} as any, combats } as any);
    expect((await request(app).get('/combats')).status).toBe(401);
    expect((await request(app).get('/combats/invalido').set('Authorization', 'Bearer alice')).status).toBe(404);
    expect((await request(app).post('/combats').set('Authorization', 'Bearer alice').send({ title: ' ' })).status).toBe(400);
    expect((await request(app).post('/combats').set('Authorization', 'Bearer alice').send({ title: 'Floresta' })).status).toBe(201);
    expect((await request(app).get('/combats').set('Authorization', 'Bearer bob')).body).toEqual([]);
  });
  it('rejects stale versions and malformed participant state', async () => {
    const combats: any = { update: async () => 'conflict' };
    const app = createApp({ verify: async token => ({ uid: token }), profiles: {} as any, combats });
    const state = { title: 'Floresta', description: null, started: true, currentParticipantId: null, version: 1, participants: [] };
    expect((await request(app).put('/combats/1').set('Authorization', 'Bearer alice').send(state)).status).toBe(409);
    expect((await request(app).put('/combats/1').set('Authorization', 'Bearer alice').send({ ...state, currentParticipantId: 5 })).status).toBe(400);
  });
});
