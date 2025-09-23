/**
 * Clamp a number to be within the inclusive range [min, max].
 *
 * @param value - The number to clamp.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @returns The clamped number.
 * @throws Error if min > max.
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (min > max) throw new Error('min cannot be greater than max')
  return Math.min(Math.max(value, min), max)
}
