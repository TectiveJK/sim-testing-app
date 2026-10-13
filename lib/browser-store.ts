import { appDataFromStore } from "@/lib/app-data";
import { emptyStore, normalizeStore } from "@/lib/store-logic";
import type { AppStore } from "@/lib/types";

const KEY = "sim-flight-testing-store-v1";

export function loadBrowserStore(): AppStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const rewritten = raw
      .replaceAll("geofence-violation", "no-fly-zone-violation")
      .replaceAll("Geofence violation", "No fly zone violation")
      .replaceAll("Geofence", "No fly zone")
      .replaceAll("geofence", "no fly zone");
    const store = normalizeStore(JSON.parse(rewritten) as Partial<AppStore>);
    if (rewritten !== raw) saveBrowserStore(store);
    return store;
  } catch {
    return emptyStore();
  }
}

export function saveBrowserStore(store: AppStore) {
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function mutateBrowserStore(mutator: (store: AppStore) => void) {
  const store = loadBrowserStore();
  mutator(store);
  saveBrowserStore(store);
  return appDataFromStore(store);
}

export function loadBrowserAppData() {
  return appDataFromStore(loadBrowserStore());
}
