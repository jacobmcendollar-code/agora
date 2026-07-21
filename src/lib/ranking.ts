/**
 * Reddit-style ranking utilities
 */

// Epoch used by the original Reddit hot algorithm (roughly Dec 2005)
const REDDIT_EPOCH = 1134028003;

/**
 * Classic Reddit "hot" score.
 * Higher is better / more recent + higher score.
 */
export function hotScore(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000 - REDDIT_EPOCH;
  return Number((sign * order + seconds / 45000).toFixed(7));
}

/**
 * "Top" is just the raw score. We keep this for clarity.
 */
export function topScore(score: number): number {
  return score;
}

/**
 * Simple "controversial" score (high when ups ≈ downs and volume is high)
 * Useful later for a "controversial" sort.
 */
export function controversialScore(ups: number, downs: number): number {
  if (ups <= 0 || downs <= 0) return 0;
  const magnitude = ups + downs;
  const balance = ups > downs ? downs / ups : ups / downs;
  return magnitude ** balance;
}
