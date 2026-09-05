function timestamp(): string {
  return new Date().toISOString();
}

export const log = {
  info(...args: unknown[]): void {
    console.log(`[${timestamp()}]`, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(`[${timestamp()}]`, ...args);
  },
  error(...args: unknown[]): void {
    console.error(`[${timestamp()}]`, ...args);
  },
};
