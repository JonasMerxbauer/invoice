export const defaultSyncUrl = "wss://free.evoluhq.com";
export const syncUrlStorageKey = "invoice:evolu-sync-url";

export function getStoredSyncUrl() {
  if (typeof localStorage === "undefined") return defaultSyncUrl;

  return localStorage.getItem(syncUrlStorageKey) || defaultSyncUrl;
}
