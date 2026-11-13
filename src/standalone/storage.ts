import { clearSession } from "@/store.js";

/** Key of the workspace that the standalone app stores in the browser. */
export const PERSIST_KEY = "arguemapper";

/** Remove everything the app stored and reload it, for when the stored state breaks it. */
export async function resetApp(): Promise<void> {
  // browsers throw on access if the site data is blocked, then nothing is stored
  try {
    await clearSession(PERSIST_KEY);
  } catch {}

  window.location.reload();
}
