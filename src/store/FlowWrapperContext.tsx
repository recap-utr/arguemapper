import { createContext, type RefObject, useContext } from "react";

/** Holds a ref to the ReactFlow wrapper DOM element of the current instance. */
const FlowWrapperContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export const FlowWrapperProvider = FlowWrapperContext.Provider;

/** The wrapper element ref for the current instance, used for geometry and image export. */
export function useFlowWrapperRef(): RefObject<HTMLDivElement | null> | null {
  return useContext(FlowWrapperContext);
}
