import type { RequestHandler } from 'express';
import type { CombatantInput } from '../models/combatant.js';
import type { CombatantsService } from '../services/combatants.js';

export function validateCombatant(value: unknown): CombatantInput | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const integer = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 9999999999;
  if (typeof v.name !== 'string' || !v.name.trim() || v.name.trim().length > 255 || (v.type !== 'player' && v.type !== 'npc') || !(v.characterId === null || (typeof v.characterId === 'string' && /^character-(1|2|3|4|5|7|8|9|10)$/.test(v.characterId))) || !integer(v.maximumHitPoints) || !integer(v.armorClass)) return null;
  return { name: v.name.trim(), type: v.type, characterId: v.characterId as string | null, maximumHitPoints: v.maximumHitPoints as number, armorClass: v.armorClass as number };
}

export function createCombatantsController(service: CombatantsService): {
  list: RequestHandler; requireProfile: RequestHandler; countCombats: RequestHandler; create: RequestHandler; update: RequestHandler; delete: RequestHandler;
} {
  return {
    async countCombats(req, res) {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) { res.sendStatus(404); return; }
      try { const count = await service.countCombats(res.locals.identity, id); if (count === null) { res.sendStatus(404); return; } res.json({ count }); }
      catch { res.status(500).json({ error: 'Não foi possível consultar combates.' }); }
    },
    async list(_req, res) {
      try {
        const items = await service.list(res.locals.identity);
        if (items === null) { res.status(404).json({ error: 'Perfil não encontrado.' }); return; }
        res.json(items);
      } catch { res.status(500).json({ error: 'Não foi possível carregar combatentes.' }); }
    },
    async requireProfile(_req, res, next) {
      try {
        if (!await service.hasProfile(res.locals.identity)) { res.status(404).json({ error: 'Perfil não encontrado.' }); return; }
        next();
      } catch { res.status(500).json({ error: 'Não foi possível carregar o perfil.' }); }
    },
    async create(req, res) {
      const input = validateCombatant(req.body);
      if (!input) { res.status(400).json({ error: 'Dados inválidos.' }); return; }
      try { res.status(201).json(await service.create(res.locals.identity, input)); }
      catch { res.status(500).json({ error: 'Não foi possível salvar.' }); }
    },
    async update(req, res) {
      const id = Number(req.params.id);
      const input = validateCombatant(req.body);
      if (!input) { res.status(400).json({ error: 'Dados inválidos.' }); return; }
      if (!Number.isSafeInteger(id) || id <= 0) { res.sendStatus(404); return; }
      try {
        const item = await service.update(res.locals.identity, id, input);
        if (!item) { res.sendStatus(404); return; }
        if (item === 'health-overflow') {
          res.status(409).json({ error: 'A redução da vida máxima excederia o limite de vida adicional em combate.' });
          return;
        }
        res.json(item);
      } catch { res.status(500).json({ error: 'Não foi possível salvar.' }); }
    },
    async delete(req, res) {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) { res.sendStatus(404); return; }
      try {
        if (!await service.delete(res.locals.identity, id)) { res.sendStatus(404); return; }
        res.sendStatus(204);
      } catch { res.status(500).json({ error: 'Não foi possível excluir.' }); }
    },
  };
}
