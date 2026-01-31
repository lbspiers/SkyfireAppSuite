export const toArray = <T>(v: T[] | undefined | null): T[] =>
  Array.isArray(v) ? v : [];
