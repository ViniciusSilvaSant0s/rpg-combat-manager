import type { RequestHandler } from 'express';
import type { CombatState, Combats, ParticipantInput } from '../models/combat.js';

const validId = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0;
const int = (n: unknown): n is number => Number.isSafeInteger(n) && Math.abs(n as number) <= 9999999999;
function metadata(value: any): { title: string; description: string | null } | null {
  if (!value || typeof value.title !== 'string' || !value.title.trim() || value.title.trim().length > 255 || !(value.description == null || (typeof value.description === 'string' && value.description.length <= 4000))) return null;
  return { title: value.title.trim(), description: value.description || null };
}
function state(value: any): CombatState | null {
  const meta = metadata(value);
  if (!meta || typeof value.started !== 'boolean' || !validId(value.version) || !(value.currentParticipantId === null || validId(value.currentParticipantId)) || !Array.isArray(value.participants)) return null;
  if (!value.participants.every((p: ParticipantInput) => p && validId(p.id) && validId(p.combatantId) && int(p.currentHitPoints) && (p.additionalHitPoints === null || (Number.isSafeInteger(p.additionalHitPoints) && p.additionalHitPoints >= 0)) && (p.initiative === null || int(p.initiative)) && (p.naturalInitiative === null || p.naturalInitiative === 1 || p.naturalInitiative === 20) && Array.isArray(p.conditions) && p.conditions.every(c => typeof c === 'string' && /^[a-z0-9-]{1,64}$/.test(c)) && new Set(p.conditions).size === p.conditions.length)) return null;
  if (new Set(value.participants.map((p: ParticipantInput) => p.id)).size !== value.participants.length || (value.currentParticipantId !== null && !value.participants.some((p: ParticipantInput) => p.id === value.currentParticipantId))) return null;
  return { ...meta, started: value.started, version: value.version, currentParticipantId: value.currentParticipantId, participants: value.participants };
}
export function createCombatsController(service: Combats): Record<'list' | 'get' | 'create' | 'update' | 'delete', RequestHandler> {
  return {
    async list(_req, res) { try { res.json(await service.list(res.locals.identity)); } catch { res.status(500).json({ error: 'Não foi possível carregar combates.' }); } },
    async get(req, res) { const id = Number(req.params.id); if (!validId(id)) { res.sendStatus(404); return; } try { const item = await service.get(res.locals.identity, id); if (!item) { res.sendStatus(404); return; } res.json(item); } catch { res.sendStatus(500); } },
    async create(req, res) { const input = metadata(req.body); if (!input) { res.status(400).json({ error: 'Dados inválidos.' }); return; } try { res.status(201).json(await service.create(res.locals.identity, input.title, input.description)); } catch { res.status(500).json({ error: 'Não foi possível criar combate.' }); } },
    async update(req, res) { const id = Number(req.params.id); if (!validId(id)) { res.sendStatus(404); return; } const input = state(req.body); if (!input) { res.status(400).json({ error: 'Dados inválidos.' }); return; } try { const result = await service.update(res.locals.identity, id, input); if (result === 'not-found') { res.sendStatus(404); return; } if (result === 'conflict') { res.status(409).json({ error: 'Combate alterado em outra sessão.' }); return; } if (result === 'invalid-participant') { res.status(400).json({ error: 'Combatente inválido.' }); return; } res.json(result); } catch { res.status(500).json({ error: 'Não foi possível salvar combate.' }); } },
    async delete(req, res) { const id = Number(req.params.id); if (!validId(id)) { res.sendStatus(404); return; } try { if (!await service.delete(res.locals.identity, id)) { res.sendStatus(404); return; } res.sendStatus(204); } catch { res.sendStatus(500); } },
  };
}
