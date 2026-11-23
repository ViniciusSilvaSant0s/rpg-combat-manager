import type { RequestHandler } from 'express';
import type { FriendshipAction } from '../models/friendship.js';
import type { createFriendshipsService } from '../services/friendships.js';

export function createFriendshipsController(service: ReturnType<typeof createFriendshipsService>) {
  const list: RequestHandler = async (_req, res) => {
    try {
      const result = await service.list(res.locals.identity);
      if (result) res.json(result);
      else res.status(404).json({ error: 'Perfil incompleto.' });
    } catch { res.status(503).json({ error: 'Não foi possível listar amizades.' }); }
  };
  const search: RequestHandler = async (req, res) => {
    const nickname = req.query.nickname;
    if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(nickname)) {
      res.status(400).json({ error: 'Nickname inválido.' });
      return;
    }
    try {
      const user = await service.search(res.locals.identity, nickname);
      if (user) res.json(user);
      else res.status(404).json({ error: 'Usuário não encontrado.' });
    } catch { res.status(503).json({ error: 'Não foi possível buscar o usuário.' }); }
  };
  const act = (action: FriendshipAction): RequestHandler => async (req, res) => {
    const target = Number(req.params.userId);
    if (!Number.isSafeInteger(target) || target <= 0) {
      res.status(400).json({ error: 'Identificador inválido.' });
      return;
    }
    try {
      const result = await service.act(res.locals.identity, target, action);
      switch (result) {
        case 'ok': res.sendStatus(204); break;
        case 'self': res.status(400).json({ error: 'Escolha outro usuário.' }); break;
        case 'missing': res.status(404).json({ error: 'Usuário ou relacionamento não encontrado.' }); break;
        case 'forbidden': res.status(403).json({ error: 'Você não pode realizar esta ação.' }); break;
        case 'conflict': res.status(409).json({ error: 'O relacionamento já foi alterado.' }); break;
      }
    } catch { res.status(503).json({ error: 'Não foi possível alterar a amizade.' }); }
  };
  return { list, search, act };
}
