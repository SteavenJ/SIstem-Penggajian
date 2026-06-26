/**
 * Resolves a day number (1-31) to a full YYYY-MM-DD string within a date range.
 * For cross-month ranges, finds the correct month where the day falls within [start, end].
 * Returns null if the day doesn't exist in the range.
 */
export function resolveDate(
  day: number,
  startDate: Date | null,
  endDate: Date | null
): string | null {
  if (isNaN(day) || day < 1 || day > 31) return null;

  if (!startDate || !endDate) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Collect all matching dates in range
  const matches: Date[] = [];
  const curr = new Date(startDate);
  
  while (curr <= endDate) {
    if (curr.getDate() === day) {
      matches.push(new Date(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }

  if (matches.length === 0) return null;

  // Return the first match that's within the range
  // (they all are by construction, so just pick the first one)
  const match = matches[0];
  return `${match.getFullYear()}-${String(match.getMonth() + 1).padStart(2, '0')}-${String(match.getDate()).padStart(2, '0')}`;
}
