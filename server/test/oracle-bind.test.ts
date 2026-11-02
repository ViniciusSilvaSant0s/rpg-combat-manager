import { describe, expect, it } from 'vitest';
import { profiles } from '../src/repositories/profiles.js';

const integration = process.env.RUN_ORACLE_INTEGRATION === '1' ? it : it.skip;
describe('Oracle profile repository integration', () => {
  integration('returns no profile for an unknown Firebase user', async () => {
    await expect(profiles.find({ uid: '__oracle_profile_probe_nonexistent__' })).resolves.toBeNull();
  }, 30000);
});
