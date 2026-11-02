import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createProfileController } from '../controllers/profile.js';

export function profileRouter(authenticate: RequestHandler, controller: ReturnType<typeof createProfileController>) {
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.find);
  router.post('/', controller.create);
  router.put('/', controller.update);
  return router;
}
