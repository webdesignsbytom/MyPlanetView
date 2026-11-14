// Comma-separated FRONTEND_ORIGIN list (quotes/trailing slashes OK)
export const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((entry) => entry.trim().replace(/^["']+|["']+$/g, '').trim())
    .filter(Boolean)
    .flatMap((entry) => {
      try {
        return [new URL(entry).origin];
      } catch {
        console.warn(`[CONFIG] Ignoring invalid FRONTEND_ORIGIN entry: ${entry}`);
        return [];
      }
    });

export const FRONTEND_ORIGINS = parseOrigins(process.env.FRONTEND_ORIGIN);
