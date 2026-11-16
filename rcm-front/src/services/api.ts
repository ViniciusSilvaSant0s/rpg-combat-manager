type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function request(method: Method, path: string, token?: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return fetch(`/api${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

export const api = {
  get: (path: string, token?: string) => request('GET', path, token),
  post: (path: string, body: unknown, token?: string) => request('POST', path, token, body),
  put: (path: string, body: unknown, token?: string) => request('PUT', path, token, body),
  patch: (path: string, body: unknown, token?: string) => request('PATCH', path, token, body),
  delete: (path: string, token?: string) => request('DELETE', path, token),
}
