export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};


export const isValidTimeFormat = (value: string): boolean => {
  // Allow empty input
  if (value === '') return true;
  
  // Allow single digit or proper MM:SS format
  return /^\d{0,2}(:\d{0,2})?$/.test(value);
};