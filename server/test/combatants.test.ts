import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import type { Identity } from '../src/models/profile.js';
import { createApp } from '../src/app.js';

describe('combatants API', () => {
  it('requires authentication and isolates records between accounts', async () => {
    const records = new Map<string, any[]>();
    const combatants = {
      hasProfile: async () => true,
      list: async (identity: Identity) => records.get(identity.uid) ?? [],
      create: async (identity: Identity, input: any) => { const item = { ...input, id: 1 }; records.set(identity.uid, [item]); return item; },
      update: async (identity: Identity, id: number, input: any) => { const item = records.get(identity.uid)?.find(x => x.id === id); if (!item) return null; Object.assign(item, input); return item; },
      delete: async (identity: Identity, id: number) => { const found = records.get(identity.uid)?.some(x => x.id === id) ?? false; if (found) records.set(identity.uid, []); return found; },
    };
    const profiles: any = { find: async () => ({ id: 1 }), create: async () => null, update: async () => null };
    const app = createApp({ verify: async token => ({ uid: token }), profiles, combatants });
    expect((await request(app).get('/combatants')).status).toBe(401);
    const input = { name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 12, armorClass: 15 };
    expect((await request(app).post('/combatants').set('Authorization', 'Bearer alice').send(input)).status).toBe(201);
    expect((await request(app).get('/combatants').set('Authorization', 'Bearer bob')).body).toEqual([]);
    expect((await request(app).delete('/combatants/1').set('Authorization', 'Bearer bob')).status).toBe(404);
    expect((await request(app).put('/combatants/1').set('Authorization', 'Bearer bob').send(input)).status).toBe(404);
    expect((await request(app).post('/combatants').set('Authorization', 'Bearer alice').send({ ...input, name: ' ' })).status).toBe(400);
    expect((await request(app).post('/combatants').set('Authorization', 'Bearer alice').send({ ...input, characterId: 'character-6' })).status).toBe(400);
    expect((await request(app).post('/combatants').set('Authorization', 'Bearer alice').send({ ...input, armorClass: -1 })).status).toBe(400);
    const updated = { ...input, name: 'Aria nova' };
    expect((await request(app).put('/combatants/1').set('Authorization', 'Bearer alice').send(updated)).body.name).toBe('Aria nova');
    expect((await request(app).delete('/combatants/1').set('Authorization', 'Bearer alice')).status).toBe(204);
    expect((await request(app).get('/combatants').set('Authorization', 'Bearer alice')).body).toEqual([]);
  });
  it('lists without loading or synchronizing the profile separately and distinguishes missing profiles', async () => {
    const profiles: any = { find: vi.fn() };
    const combatants: any = { list: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(null) };
    const app = createApp({ verify: async token => ({ uid: token }), profiles, combatants });
    expect((await request(app).get('/combatants').set('Authorization', 'Bearer alice')).body).toEqual([]);
    expect((await request(app).get('/combatants').set('Authorization', 'Bearer missing')).status).toBe(404);
    expect(profiles.find).not.toHaveBeenCalled();
  });
  it('preserves errors for a missing profile and database failures', async () => {
    const combatants: any = { list: vi.fn().mockRejectedValue(new Error('database')), hasProfile: vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('database')) };
    const app = createApp({ verify: async token => ({ uid: token }), profiles: {} as any, combatants });
    const token = 'Bearer user';
    expect((await request(app).get('/combatants').set('Authorization', token)).status).toBe(500);
    expect((await request(app).post('/combatants').set('Authorization', token).send({})).status).toBe(404);
    expect((await request(app).delete('/combatants/1').set('Authorization', token)).status).toBe(500);
  });
});
