import type { RequestHandler } from 'express';
import type { ProfileInput } from '../models/profile.js';
import type { ProfileService } from '../services/profile.js';

export function validProfile(input: unknown): input is ProfileInput {
  if (!input || typeof input !== 'object') return false;
  const { nickname, birthDate } = input as Record<string, unknown>;
  if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(nickname)) return false;
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate.startsWith('0000')) return false;
  const date = new Date(`${birthDate}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === birthDate && birthDate <= new Date().toISOString().slice(0, 10);
}
function isConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'PROFILE_CONFLICT';
}
export function createProfileController(service: ProfileService): { find: RequestHandler; create: RequestHandler; update: RequestHandler } {
  return {
    async find(_req, res) {
      try {
        const profile = await service.find(res.locals.identity);
        if (!profile) { res.status(404).json({ error: 'Perfil incompleto.' }); return; }
        res.json(profile);
      } catch { res.status(503).json({ error: 'Não foi possível acessar o perfil.' }); }
    },
    async create(req, res) {
      if (!validProfile(req.body)) { res.status(400).json({ error: 'Nickname ou data de nascimento inválidos.' }); return; }
      try { res.status(201).json(await service.create(res.locals.identity, { nickname: req.body.nickname, birthDate: req.body.birthDate })); }
      catch (error) {
        if (isConflict(error)) { res.status(409).json({ error: 'Nickname indisponível ou perfil já cadastrado.' }); return; }
        res.status(503).json({ error: 'Não foi possível salvar o perfil.' });
      }
    },
    async update(req, res) {
      if (!validProfile(req.body)) { res.status(400).json({ error: 'Nickname ou data de nascimento inválidos.' }); return; }
      try {
        const profile = await service.update(res.locals.identity, { nickname: req.body.nickname, birthDate: req.body.birthDate });
        if (!profile) { res.status(404).json({ error: 'Perfil incompleto.' }); return; }
        res.json(profile);
      } catch (error) {
        if (isConflict(error)) { res.status(409).json({ error: 'Nickname indisponível.' }); return; }
        res.status(503).json({ error: 'Não foi possível salvar o perfil.' });
      }
    },
  };
}
