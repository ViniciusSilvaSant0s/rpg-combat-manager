// Temporary diagnostics: remove after investigating profile latency.
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

type Timing = { id: string; started: number; steps: string[] };
const context = new AsyncLocalStorage<Timing>();

export const profileTiming: RequestHandler = (req, res, next) => {
  if (process.env.PROFILE_TIMING !== '1') { next(); return; }
  const timing: Timing = { id: randomUUID().slice(0, 8), started: performance.now(), steps: [] };
  context.run(timing, () => {
    res.on('finish', () => {
      const total = (performance.now() - timing.started).toFixed(1);
      console.log(`[PROFILE-TIMING] id=${timing.id} method=${req.method} status=${res.statusCode} ${timing.steps.join(' ')} request.total=${total}ms`);
    });
    next();
  });
};

export async function measureProfileStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const timing = context.getStore();
  if (!timing) return fn();
  const start = performance.now();
  try { return await fn(); }
  finally { timing.steps.push(`${name}=${(performance.now() - start).toFixed(1)}ms`); }
}
