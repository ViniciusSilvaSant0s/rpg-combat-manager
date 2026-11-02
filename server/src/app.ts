import express from 'express';
import type { Identity, Profiles } from './models/profile.js';
import { profiles } from './repositories/profiles.js';
import { profileRouter } from './routes/profile.js';
import { verifyFirebaseToken } from './services/firebase.js';
import { authenticate } from './middlewares/authenticate.js';
import { createProfileService } from './services/profile.js';
import { createProfileController } from './controllers/profile.js';

export function createApp(deps: { verify: (token: string) => Promise<Identity>; profiles: Profiles }) {
  const app = express();
  app.use(express.json());
  app.get('/health', (_request, response) => { response.json({ status: 'ok' }); });
  const service = createProfileService(deps.profiles);
  const controller = createProfileController(service);
  app.use('/profile', profileRouter(authenticate(deps.verify), controller));
  app.use((_request, response) => { response.status(404).json({ error: 'Not found' }); });
  return app;
}
export const app = createApp({ verify: verifyFirebaseToken, profiles });
