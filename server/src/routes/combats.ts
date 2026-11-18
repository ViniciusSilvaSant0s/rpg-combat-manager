import { Router, type RequestHandler } from 'express';
import type { createCombatsController } from '../controllers/combats.js';

export function combatsRouter(authenticate: RequestHandler, controller: ReturnType<typeof createCombatsController>) {
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);
  return router;
}
