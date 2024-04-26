export const TOKENS = {
  "1": "0x6081d7F04a8c31e929f25152d4ad37c83638C62b",
  "31337": "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  "11155111": "0x35a0a84E0DDA0587794E1FB19543C65926040E03",
  "43113": "0x44f9a4d2441efBf23646928CB6F27219f2b79A1a",
};

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
