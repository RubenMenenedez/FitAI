export interface StreakState { currentStreakDays: number; longestStreakDays: number; lastLoggedDate: string | null }
export interface StreakUpdateResult { currentStreakDays: number; longestStreakDays: number; lastLoggedDate: string }

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay);
}

export function computeStreakUpdate(input: { today: string } & StreakState): StreakUpdateResult {
  const { today, lastLoggedDate, currentStreakDays, longestStreakDays } = input;

  if (lastLoggedDate === today) {
    return { currentStreakDays, longestStreakDays, lastLoggedDate: today };
  }

  let newCurrent: number;
  if (lastLoggedDate && daysBetween(today, lastLoggedDate) === 1) {
    newCurrent = currentStreakDays + 1;
  } else {
    newCurrent = 1;
  }

  return { currentStreakDays: newCurrent, longestStreakDays: Math.max(longestStreakDays, newCurrent), lastLoggedDate: today };
}
