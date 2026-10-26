import { type Context, createContext, useContext } from "react";

export interface ArgueConfig {
  /** Instance id; namespaces ReactFlow and the SVG arrow markers so instances don't collide. */
  id: string;
  /** When true, all editing is disabled (pure viewer). */
  readOnly: boolean;
  /** Show the on-canvas toolbar (undo/redo/zoom/fit/layout). */
  toolbar: boolean;
  /** Whether the assistant is enabled (shows the assistant section). */
  assistant: boolean;
  /** Whether the unified sidebar is enabled (shows the on-canvas section switcher). */
  sidebar: boolean;
}

const ArgueConfigContext = createContext<ArgueConfig>({
  id: "arguemapper",
  readOnly: false,
  toolbar: false,
  assistant: false,
  sidebar: false,
});

export const ArgueConfigProvider: Context<ArgueConfig> = ArgueConfigContext;

export function useArgueConfig(): ArgueConfig {
  return useContext(ArgueConfigContext);
}

/** SVG marker id for an edge end, namespaced to the instance. */
export function markerId(instanceId: string, selected: boolean): string {
  return `${instanceId}-marker${selected ? "-selected" : ""}`;
}
