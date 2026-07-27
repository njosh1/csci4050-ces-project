// Showtimes are stored as 24-hour "HH:MM" strings (matches <input type="time">
// and keeps scheduling-conflict checks on a single consistent format).
// This only formats them for display.
export function formatShowtime(time: string): string {
  const [hoursRaw, minutes] = time.split(":");
  const hours = Number(hoursRaw);

  if (Number.isNaN(hours) || !minutes) {
    return time;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${period}`;
}
