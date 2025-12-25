import type { TaskPriority } from '../types';

const PRIORITY_REWARDS: Record<TaskPriority, { gold: number; xp: number }> = {
  low: { gold: 10, xp: 20 },
  medium: { gold: 20, xp: 40 },
  high: { gold: 50, xp: 100 },
};

export function calculateRewards(priority: TaskPriority, focusRating = 3) {
  const base = PRIORITY_REWARDS[priority];
  const focusMultiplier =
    focusRating <= 1
      ? 0.5
      : focusRating === 2
      ? 0.75
      : focusRating === 3
      ? 1
      : focusRating === 4
      ? 1.25
      : 1.5;

  return {
    gold: Math.round(base.gold * focusMultiplier),
    xp: Math.round(base.xp * focusMultiplier),
  };
}
