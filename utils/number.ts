export const avg = (arr: number[]): number =>
  arr.reduce((a, b) => a + b, 0) / arr.length;

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
