import type { RequestHandler } from 'express';
import type { Identity } from '../models/profile.js';

export function authenticate(verify: (token: string) => Promise<Identity>): RequestHandler {
  return async (req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    const match = /^Bearer (\S+)$/.exec(req.header('authorization') ?? '');
    if (!match) { res.status(401).json({ error: 'Não autenticado.' }); return; }
    try {
      const identity = await verify(match[1]);
      if (identity.firebase?.sign_in_provider === 'password' && !identity.email_verified) {
        res.status(403).json({ error: 'Confirme seu e-mail antes de continuar.' }); return;
      }
      res.locals.identity = identity;
      next();
    } catch { res.status(401).json({ error: 'Token inválido ou expirado.' }); }
  };
}
