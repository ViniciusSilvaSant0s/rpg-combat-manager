import { Router, type RequestHandler } from 'express';
import type { createFriendshipsController } from '../controllers/friendships.js';

export function friendshipsRouter(auth: RequestHandler, controller: ReturnType<typeof createFriendshipsController>) {
  const router = Router();
  router.use(auth);
  router.get('/', controller.list);
  router.get('/search', controller.search);
  for (const action of ['request', 'accept', 'decline', 'cancel'] as const) {
    router.post(`/:userId/${action}`, controller.act(action));
  }
  router.delete('/:userId', controller.act('remove'));
  return router;
}
