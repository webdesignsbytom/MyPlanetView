// Pure helpers for deleting stored files in bulk (tests/mediaBatches.test.js).

// DeleteObjects takes at most 1,000 keys per request (S3 and R2)
export const DELETE_BATCH_MAX = 1000;

/** `list` in consecutive pieces of at most `size` items. */
export function chunk(list, size = DELETE_BATCH_MAX) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError(`chunk size must be 1 or more, got ${size}`);
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Distinct non-empty string keys, in their first order. */
export const distinctKeys = (keys) => [...new Set((keys || []).filter((k) => typeof k === 'string' && k))];

/**
 * What a DeleteObjects reply says about `keys`: the ones it lists under `Errors`
 * failed, the rest are gone (with `Quiet` the reply lists errors only).
 * -> `{ removed: string[], failed: string[] }`
 */
export function deleteResult(keys, reply) {
  const failed = new Set((reply?.Errors || []).map((e) => e?.Key).filter(Boolean));
  return { removed: keys.filter((k) => !failed.has(k)), failed: keys.filter((k) => failed.has(k)) };
}

/**
 * Run `fn` over `items`, at most `limit` at a time. Never rejects: -> `[{ ok, item, value | error }]`
 * in the items' order.
 */
export async function settleWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { ok: true, item: items[i], value: await fn(items[i]) };
      } catch (error) {
        results[i] = { ok: false, item: items[i], error };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
