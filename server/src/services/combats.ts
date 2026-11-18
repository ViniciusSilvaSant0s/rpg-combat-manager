import type { Combats } from '../models/combat.js';

export function createCombatsService(repository: Combats): Combats {
  return repository;
}
