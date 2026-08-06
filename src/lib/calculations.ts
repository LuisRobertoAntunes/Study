export const formatTime = (minutes: number): string => {
  if (isNaN(minutes) || minutes < 0) return "0h 0min";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}min`;
};

export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

export const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 80) {
    return "text-green-500";
  } else if (percentage >= 60) {
    return "text-yellow-500";
  } else if (percentage >= 40) {
    return "text-orange-500";
  } else {
    return "text-red-500";
  }
};
