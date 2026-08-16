import request from 'supertest';
import { spawn, type ChildProcess } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('application routes', () => {
  it('returns an operational status from GET /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for an unknown route', async () => {
    const response = await request(app).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});

describe('server entry point', () => {
  it('listens on the port supplied through PORT', async () => {
    const port = 31_000 + Math.floor(Math.random() * 1_000);
    let server: ChildProcess | undefined;

    try {
      server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
        cwd: process.cwd(),
        env: { ...process.env, PORT: String(port) },
      });

      const response = await waitForHealth(port);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    } finally {
      server?.kill();
    }
  }, 10_000);
});

async function waitForHealth(port: number): Promise<Response> {
  const url = `http://127.0.0.1:${port}/health`;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      return await fetch(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Server did not start on port ${port}`);
}
