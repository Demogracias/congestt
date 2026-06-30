const store = new Map<string, { data: any; expiresAt: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) { store.delete(key); return undefined; }
  return entry.data as T;
}

export function cacheSet(key: string, data: any, ttlMs: number = 60000) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheClear(pattern?: string) {
  if (!pattern) { store.clear(); return; }
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key);
  }
}

export function cacheWrap<T>(key: string, fn: () => Promise<T>, ttlMs: number = 60000): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return Promise.resolve(cached);
  return fn().then(data => { cacheSet(key, data, ttlMs); return data; });
}
