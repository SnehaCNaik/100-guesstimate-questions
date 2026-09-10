/**
 * Tiny module-level cache for the local user id, set once at boot
 * (App.tsx). Everything else reads it synchronously — no Context needed
 * for a value that never changes during the app's lifetime.
 */
let cachedUserId: string | null = null;

export function setUserId(id: string) {
  cachedUserId = id;
}

export function getUserId(): string {
  if (!cachedUserId) {
    throw new Error('getUserId() called before database initialization completed');
  }
  return cachedUserId;
}
