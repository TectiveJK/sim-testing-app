import { catalogPayload } from "@/lib/catalog";
import { BUILTIN_MISSIONS } from "@/lib/missions";
import { emptyStore } from "@/lib/store-logic";
import type { AppData } from "@/lib/client-types";
import { COMMANDS, type AppStore } from "@/lib/types";

export function appDataFromStore(store: AppStore): AppData {
  const { tests, states, phasesByState } = catalogPayload(store.customTests);
  return {
    store,
    catalog: {
      tests,
      missions: BUILTIN_MISSIONS,
      states,
      phasesByState,
      commands: [...COMMANDS],
    },
  };
}

export function emptyAppData(): AppData {
  return appDataFromStore(emptyStore());
}
