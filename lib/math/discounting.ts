/**
 * Time-Value Discounting Utilities
 * For calculating present value of prediction market positions
 */

/**
 * Calculate present value using continuous compounding
 * PV = FV * e^(-r*t)
 */
export function presentValueContinuous(
  futureValue: number,
  annualRate: number,
  years: number
): number {
  return futureValue * Math.exp(-annualRate * years);
}

/**
 * Calculate present value using simple interest
 * PV = FV / (1 + r*t)
 */
export function presentValueSimple(
  futureValue: number,
  annualRate: number,
  years: number
): number {
  return futureValue / (1 + annualRate * years);
}

/**
 * Calculate present value using compound interest
 * PV = FV / (1 + r)^t
 */
export function presentValueCompound(
  futureValue: number,
  annualRate: number,
  years: number
): number {
  return futureValue / Math.pow(1 + annualRate, years);
}

/**
 * Calculate the effective annual rate given the days to resolution
 * and a base annual rate
 */
export function effectiveRate(
  baseAnnualRate: number,
  daysToResolution: number
): number {
  const years = daysToResolution / 365;
  return baseAnnualRate * years;
}

/**
 * Calculate the time-adjusted expected value
 * Applies both probability weighting and time discounting
 */
export function timeAdjustedEV(
  possiblePayoffs: { payoff: number; probability: number }[],
  daysToResolution: number,
  annualRate: number = 0.10
): number {
  const ev = possiblePayoffs.reduce(
    (sum, p) => sum + p.payoff * p.probability,
    0
  );
  
  const years = daysToResolution / 365;
  return presentValueSimple(ev, annualRate, years);
}

/**
 * Calculate the breakeven discount rate
 * Given an expected payoff and required return, what discount rate makes them equal?
 */
export function breakevenRate(
  expectedPayoff: number,
  currentCost: number,
  daysToResolution: number
): number {
  if (expectedPayoff <= currentCost) return Infinity;
  
  const years = daysToResolution / 365;
  if (years === 0) return 0;
  
  // Using simple interest: currentCost = expectedPayoff / (1 + r*t)
  // Solving for r: r = (expectedPayoff/currentCost - 1) / t
  return (expectedPayoff / currentCost - 1) / years;
}

/**
 * Calculate Sharpe-like ratio for a position
 * (Expected return - risk-free rate) / volatility
 */
export function positionSharpe(
  expectedReturn: number,
  volatility: number,
  riskFreeRate: number = 0.05
): number {
  if (volatility === 0) return 0;
  return (expectedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate days between now and a future date
 */
export function daysUntil(futureDate: Date | string): number {
  const future = typeof futureDate === 'string' ? new Date(futureDate) : futureDate;
  const now = new Date();
  const diffMs = future.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Format days as human-readable duration
 */
export function formatDuration(days: number): string {
  if (days < 1) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
}
