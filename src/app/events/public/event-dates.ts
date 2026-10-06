/**
 * The backend speaks LocalDateTime, so values arrive as `YYYY-MM-DDTHH:mm:ss` with no zone and are
 * read as the reader's own local time - which is what everybody expects of "Saturday at 18:00".
 */

export function parseLocal(value: string): Date {
  return new Date(value);
}

export function toLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

/** What a `datetime-local` input wants, which is the same thing minus the seconds. */
export function toInputValue(date: Date): string {
  return toLocalDateTime(date).slice(0, 16);
}

export function formatDay(value: string): string {
  return parseLocal(value).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(value: string): string {
  return parseLocal(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDayTime(value: string): string {
  return `${formatDay(value)}, ${formatTime(value)}`;
}

/** "in 3 days", "in 4 hours", "today" - a deadline means nothing without the distance to it. */
export function formatTimeLeft(value: string, from: Date = new Date()): string {
  const minutes = Math.round((parseLocal(value).getTime() - from.getTime()) / 60000);

  if (minutes <= 0) {
    return 'passed';
  }
  if (minutes < 60) {
    return `in ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}
