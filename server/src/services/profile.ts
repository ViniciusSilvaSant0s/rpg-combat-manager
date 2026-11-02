import type { Identity, ProfileInput, Profiles } from '../models/profile.js';

export function createProfileService(profiles: Profiles) {
  return {
    find: (identity: Identity) => profiles.find(identity),
    create: (identity: Identity, input: ProfileInput) => profiles.create(identity, input),
    update: (identity: Identity, input: ProfileInput) => profiles.update(identity, input),
  };
}
export type ProfileService = ReturnType<typeof createProfileService>;
