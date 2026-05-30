import { createContext, useContext } from "react";

export interface ArgueConfig {
  /** Instance id; namespaces ReactFlow and the SVG arrow markers so instances don't collide. */
  id: string;
  /** When true, all editing is disabled (pure viewer). */
  readOnly: boolean;
  /** Show the on-canvas toolbar (undo/redo/zoom/fit/layout). */
  toolbar: boolean;
  /** Whether the assistant is enabled (shows the assistant toggle button). */
  assistant: boolean;
}

const ArgueConfigContext = createContext<ArgueConfig>({
  id: "arguemapper",
  readOnly: false,
  toolbar: false,
  assistant: false,
});

export const ArgueConfigProvider = ArgueConfigContext.Provider;

export function useArgueConfig(): ArgueConfig {
  return useContext(ArgueConfigContext);
}

/** SVG marker id for an edge end, namespaced to the instance. */
export function markerId(instanceId: string, selected: boolean): string {
  return `${instanceId}-marker${selected ? "-selected" : ""}`;
}
