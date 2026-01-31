// src/utils/devLogger.ts
type L = "log" | "info" | "warn" | "error" | "debug";

const orig = { ...console };
const counters = new Map<string, { count: number; last: number }>();
const WINDOW_MS = 1500; // collapse repeats within 1.5s

const stringify = (args: any[]) => {
  return args
    .map((a) => {
      try {
        return typeof a === "string" ? a : JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
};

const emit = (level: L, args: any[]) => {
  const msg = stringify(args);
  const key = level + "|" + msg;
  const now = Date.now();
  const item = counters.get(key);

  if (!item) {
    counters.set(key, { count: 1, last: now });
    return (orig as any)[level](...args);
  }

  // within window → just bump count
  if (now - item.last < WINDOW_MS) {
    item.count++;
    item.last = now;
    return;
  }

  // window passed → flush aggregated count then print fresh
  if (item.count > 1) (orig as any)[level](`[x${item.count}] ${msg}`);
  item.count = 1;
  item.last = now;
  (orig as any)[level](...args);
};

// optional: drop super-noisy messages by substring
const DROP = [
  "No RCS Configuration was found", // example noisy system line
];

const wrap =
  (level: L) =>
  (...a: any[]) => {
    const s = stringify(a);
    if (DROP.some((d) => s.includes(d))) return;
    emit(level, a);
  };

console.log = wrap("log");
console.info = wrap("info");
console.warn = wrap("warn");
console.error = wrap("error");
console.debug = wrap("debug");

// optional scoped helper
export const scope =
  (name: string) =>
  (...a: any[]) =>
    console.log(`[${name}]`, ...a);
if (__DEV__) {
  const flush = () => {
    counters.forEach((v, k) => {
      if (v.count > 1) {
        const [level, msg] = k.split("|");
        (orig as any)[level](`[x${v.count}] ${msg}`);
      }
    });
    counters.clear();
  };
  const id = setInterval(flush, 2000);
  // Optional: export a manual flush() and call in AppState change
}
