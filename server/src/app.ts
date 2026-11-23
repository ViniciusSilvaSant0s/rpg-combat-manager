import express from 'express';
import type { Identity, Profiles } from './models/profile.js';
import { profiles } from './repositories/profiles.js';
import { profileRouter } from './routes/profile.js';
import { verifyFirebaseToken } from './services/firebase.js';
import { authenticate } from './middlewares/authenticate.js';
import { createProfileService } from './services/profile.js';
import { createProfileController } from './controllers/profile.js';
import { combatants as defaultCombatants } from './repositories/combatants.js';
import type { Combatants } from './models/combatant.js';
import { createCombatantsService } from './services/combatants.js';
import { createCombatantsController } from './controllers/combatants.js';
import { combatantsRouter } from './routes/combatants.js';
import { combats as defaultCombats } from './repositories/combats.js';
import type { Combats } from './models/combat.js';
import { createCombatsService } from './services/combats.js';
import { createCombatsController } from './controllers/combats.js';
import { combatsRouter } from './routes/combats.js';

import type { Friendships } from './models/friendship.js';
import { friendships } from './repositories/friendships.js';
import { createFriendshipsService } from './services/friendships.js';
import { createFriendshipsController } from './controllers/friendships.js';
import { friendshipsRouter } from './routes/friendships.js';

export function createApp(deps: { verify: (token: string) => Promise<Identity>; profiles: Profiles; combatants?: Combatants; combats?: Combats; friendships?: Friendships }) {
  const app = express();
  app.use(express.json());
  app.get('/health', (_request, response) => { response.json({ status: 'ok' }); });
  const service = createProfileService(deps.profiles);
  const controller = createProfileController(service);
  app.use('/profile', profileRouter(authenticate(deps.verify), controller));
  const combatantsService = createCombatantsService(deps.combatants ?? defaultCombatants);
  const combatantsController = createCombatantsController(combatantsService);
  app.use('/combatants', combatantsRouter(authenticate(deps.verify), combatantsController));
  app.use('/combats', combatsRouter(authenticate(deps.verify), createCombatsController(createCombatsService(deps.combats ?? defaultCombats))));
  const friendsController = createFriendshipsController(createFriendshipsService(deps.friendships ?? friendships));
  app.use('/friendships', friendshipsRouter(authenticate(deps.verify), friendsController));
  app.use((_request, response) => { response.status(404).json({ error: 'Not found' }); });
  return app;
}
export const app = createApp({ verify: verifyFirebaseToken, profiles });
