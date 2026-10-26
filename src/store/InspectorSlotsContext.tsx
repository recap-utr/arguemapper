import { type Context, createContext, type ReactNode, useContext } from "react";

/**
 * Host-provided content injected into the inspector. Lets an embedding app (or the standalone app)
 * add its own widgets to the relevant accordions without the library carrying app-specific chrome.
 */
export interface InspectorSlots {
  /** Appended to the Import accordion (e.g. extra import sources like AIFdb). */
  import?: ReactNode;
  /** Appended to the Configuration accordion (e.g. a clear-cache button). */
  configuration?: ReactNode;
}

const InspectorSlotsContext = createContext<InspectorSlots>({});

export const InspectorSlotsProvider: Context<InspectorSlots> = InspectorSlotsContext;

export function useInspectorSlots(): InspectorSlots {
  return useContext(InspectorSlotsContext);
}
