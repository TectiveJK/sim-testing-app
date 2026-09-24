import { appDataFromStore } from "@/lib/app-data";
import { emptyStore, normalizeStore } from "@/lib/store-logic";
import type { AppStore } from "@/lib/types";

const KEY = "sim-flight-testing-store-v1";

export function loadBrowserStore(): AppStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    return normalizeStore(JSON.parse(raw) as Partial<AppStore>);
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
