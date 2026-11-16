import { afterEach, expect, test, vi } from 'vitest'
import { api } from './services/api'
import { combatantsService } from './services/combatants'
import { profileService } from './services/profile'

vi.mock('./auth/firebase', () => ({ firebaseAuth: () => ({ currentUser: { getIdToken: async () => 'token' } }) }))

afterEach(() => vi.unstubAllGlobals())

test('sends JSON and an authorization token with API requests', async () => {
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const response = await api.post('/combatants', { name: 'Aria' }, 'token')
  expect(response.status).toBe(200)
  expect(fetchMock).toHaveBeenCalledWith('/api/combatants', {
    method: 'POST',
    headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
    body: '{"name":"Aria"}',
  })
})

test('preserves status codes so profile screens can handle missing or conflicting profiles', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })))
  expect((await profileService.get('token')).status).toBe(404)
})

test('deletes a combatant without attempting to parse an empty response', async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  await expect(combatantsService.remove(42)).resolves.toBeUndefined()
  expect(fetchMock).toHaveBeenCalledWith('/api/combatants/42', {
    method: 'DELETE', headers: { Authorization: 'Bearer token' },
  })
})

test('propagates API failures to the combatant screen', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })))
  await expect(combatantsService.list()).rejects.toThrow('Não foi possível concluir')
})
