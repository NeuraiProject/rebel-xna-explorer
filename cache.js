/*
  Small in-memory caches for the explorer API.

  Values are stored as promises, so requests that arrive while the node is
  still answering share one RPC call instead of each making their own.
  A rejected promise is dropped, so the next caller asks again.
*/

/**
 * @param {{ttl?: number, max?: number}} [options] ttl in ms (0 = until evicted), max entries
 */
export function createCache({ ttl = 0, max = 1000 } = {}) {
  /** @type {Map<string, {value: Promise<any>, expires: number}>} */
  const entries = new Map();

  return {
    /**
     * @template T
     * @param {string} key
     * @param {() => Promise<T> | T} load
     * @param {number} [entryTtl] overrides the cache's ttl for this entry
     * @returns {Promise<T>}
     */
    get(key, load, entryTtl) {
      const now = Date.now();
      const hit = entries.get(key);
      if (hit && (hit.expires === 0 || hit.expires > now)) {
        //Least recently used goes first: move the hit to the end
        entries.delete(key);
        entries.set(key, hit);
        return hit.value;
      }
      const lifetime = entryTtl === undefined ? ttl : entryTtl;
      const value = Promise.resolve().then(load);
      const entry = { value, expires: lifetime ? now + lifetime : 0 };
      entries.set(key, entry);
      value.catch(() => {
        if (entries.get(key) === entry) entries.delete(key);
      });
      while (entries.size > max) {
        entries.delete(entries.keys().next().value);
      }
      return value;
    },
    /** @param {string} key */
    delete(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}

/**
 * Like Promise.all over items.map(fn), with at most `limit` calls at a time,
 * so a page of fifty transactions does not open fifty RPC connections.
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
export async function mapLimit(items, limit, fn) {
  /** @type {R[]} */
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
