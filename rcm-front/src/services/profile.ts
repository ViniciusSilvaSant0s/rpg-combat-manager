import { api } from './api'

export type Profile = { nickname: string; birthDate: string }

export const profileService = {
  get: (token: string) => api.get('/profile', token),
  create: (profile: Profile, token: string) => api.post('/profile', profile, token),
  update: (changes: Partial<Profile>, token: string) => api.patch('/profile', changes, token),
}
