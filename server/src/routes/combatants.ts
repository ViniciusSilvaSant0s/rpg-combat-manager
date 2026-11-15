import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createCombatantsController } from '../controllers/combatants.js';

export function combatantsRouter(authenticate: RequestHandler, controller: ReturnType<typeof createCombatantsController>) {
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  router.use(controller.requireProfile);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);
  return router;
}
