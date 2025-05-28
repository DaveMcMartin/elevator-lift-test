/**
 * Calculates the average of an array of numbers.
 * @param {number[]} arr - The array of numbers to calculate the average for.
 * @returns {number} The average value of the numbers in the array.
 */
export const avg = (arr: number[]): number =>
  arr.reduce((a, b) => a + b, 0) / arr.length;

/**
 * Formats a duration in seconds into a human-readable string (e.g., "2h 30min 15s").
 * @param {number} seconds - The duration in seconds to format.
 * @returns {string} A formatted string representing the duration.
 */
export const formatDuration = (seconds: number): string => {
  const roundedSeconds = Math.round(seconds);
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }

  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (hours === 0) {
    return minutes === 0
      ? `${remainingSeconds}s`
      : `${minutes}min ${remainingSeconds}s`;
  }

  return `${hours}h ${minutes}min ${remainingSeconds}s`;
};
