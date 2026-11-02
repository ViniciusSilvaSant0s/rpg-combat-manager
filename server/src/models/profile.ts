export interface Identity {
  uid: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
}
export interface ProfileInput { nickname: string; birthDate: string }
export interface Profile extends ProfileInput { id: number; email: string | null; displayName: string | null }
export interface Profiles {
  find(identity: Identity): Promise<Profile | null>;
  create(identity: Identity, input: ProfileInput): Promise<Profile>;
  update(identity: Identity, input: ProfileInput): Promise<Profile | null>;
}
