import { describe, expect, test } from 'vitest'
import config from './vite.config'

describe('vite development server config', () => {
  test('proxies /api requests to the backend and enables Docker-friendly file watching', () => {
    expect(config.server?.host).toBe('0.0.0.0')
    expect(config.server?.watch?.usePolling).toBe(true)
    expect(config.server?.watch?.interval).toBe(1000)

    const apiProxy = config.server?.proxy?.['/api']

    expect(apiProxy).toBeDefined()
    expect(apiProxy?.target).toBe('http://server:3000')
    expect(apiProxy?.changeOrigin).toBe(true)
    expect(apiProxy?.rewrite?.('/api/health')).toBe('/health')
  })
})
