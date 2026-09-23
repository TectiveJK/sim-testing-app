import { COMMANDS } from "@/lib/types";
import { catalogPayload } from "@/lib/catalog";
import { BUILTIN_MISSIONS } from "@/lib/missions";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  const { tests, states, phasesByState } = catalogPayload(store.customTests);

  return Response.json(
    {
      store,
      catalog: {
        tests,
        missions: BUILTIN_MISSIONS,
        states,
        phasesByState,
        commands: [...COMMANDS],
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
