export const snakeToCamel = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item));
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>).reduce(
      (result: Record<string, unknown>, key: string) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter: string) =>
          letter.toUpperCase()
        );
        const value = (obj as Record<string, unknown>)[key];

        // Handle Date objects from MySQL - keep as-is
        if (value instanceof Date) {
          result[camelKey] = value;
        } else if (value !== null && typeof value === "object") {
          result[camelKey] = snakeToCamel(value);
        } else {
          result[camelKey] = value;
        }
        return result;
      },
      {}
    );
  }
  return obj;
};

/**
 * Format ISO date string to YYYY-MM-DD
 */
const formatDateForSQL = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    // Already YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // ISO format with time (e.g., 2026-01-31T17:00:00.000Z)
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return value.split("T")[0];
    }
  }
  return String(value);
};

export const camelToSnake = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map((item) => camelToSnake(item));
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>).reduce(
      (result: Record<string, unknown>, key: string) => {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        const value = (obj as Record<string, unknown>)[key];

        // Handle date fields - format to YYYY-MM-DD
        if (
          (snakeKey === "start_date" || snakeKey === "end_date") &&
          value !== null &&
          value !== undefined
        ) {
          result[snakeKey] = formatDateForSQL(value);
        } else if (value instanceof Date) {
          result[snakeKey] = value.toISOString().split("T")[0];
        } else if (value !== null && typeof value === "object") {
          result[snakeKey] = camelToSnake(value);
        } else {
          result[snakeKey] = value;
        }
        return result;
      },
      {}
    );
  }
  return obj;
};
