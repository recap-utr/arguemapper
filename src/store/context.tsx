import { createContext, useContext } from "react";
import type { ArgueStore } from "./types.js";

const ArgueStoreContext = createContext<ArgueStore | null>(null);

export const ArgueStoreProvider = ArgueStoreContext.Provider;

/** Access the current instance's store API (getState/setState/subscribe + temporal). */
export function useStoreApi(): ArgueStore {
  const store = useContext(ArgueStoreContext);
  if (store === null) {
    throw new Error("useStoreApi must be used within an <ArgueMapper> (ArgueStoreProvider).");
  }
  return store;
}
