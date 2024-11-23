/**
 * Available timestamp format presets
 */
export type TimestampPreset = 
  | 'short'      // 14:32:24
  | 'time'       // 14:32:24.432
  | 'iso'        // 2024-11-22T14:32:24.432Z
  | 'date'       // 2024-11-22
  | 'datetime'   // 2024-11-22 14:32:24
  | 'compact'    // 20241122143224
  | 'relative'   // 2s ago, 5m ago, etc.
  | 'unix'       // 1700871144432
  | 'none';      // No timestamp

/**
 * Timestamp formatter function type
 */
export type TimestampFormatter = (date: Date) => string;

/**
 * Configuration for timestamp formatting
 */
export type TimestampConfig = {
  preset?: TimestampPreset;
  custom?: (date: Date) => string;
};

/**
 * Format a relative time (e.g., "2s ago", "5m ago")
 */
const formatRelativeTime = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * Pad a number with leading zeros
 */
const pad = (num: number, size: number = 2): string => 
  num.toString().padStart(size, '0');

/**
 * Create timestamp formatter based on preset or custom function
 */
export const createTimestampFormatter = (config: TimestampConfig = { preset: 'datetime' }): TimestampFormatter => {
  if (config.custom) {
    return config.custom;
  }

  switch (config.preset) {
    case 'short':
      return (date: Date): string => {
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
      };

    case 'time':
      return (date: Date): string => {
        const base = createTimestampFormatter({ preset: 'short' })(date);
        const ms = pad(date.getMilliseconds(), 3);
        return `${base}.${ms}`;
      };

    case 'iso':
      return (date: Date): string => date.toISOString();

    case 'date':
      return (date: Date): string => {
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        return `${year}-${month}-${day}`;
      };

    case 'datetime':
      return (date: Date): string => {
        const dateStr = createTimestampFormatter({ preset: 'date' })(date);
        const timeStr = createTimestampFormatter({ preset: 'short' })(date);
        return `${dateStr} ${timeStr}`;
      };

    case 'compact':
      return (date: Date): string => {
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
      };

    case 'relative':
      return formatRelativeTime;

    case 'unix':
      return (date: Date): string => date.getTime().toString();

    case 'none':
      return (): string => '';

    default:
      return createTimestampFormatter({ preset: 'datetime' });
  }
};