export function formatSeconds(seconds) {
  // Calculate days, hours, minutes, and remaining seconds
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Format hours, minutes, and seconds to be always two digits
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  // Construct the time string based on the number of days
  let timeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  if (days > 0) {
      timeString = `${days} day${days > 1 ? 's' : ''}, ${timeString}`;
  }

  return timeString;
};
