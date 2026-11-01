import { type Context, createContext, useContext } from "react";

export interface ArgueConfig {
  /** Instance id; namespaces ReactFlow and the SVG arrow markers so instances don't collide. */
  id: string;
  /** When true, all editing is disabled (pure viewer). */
  readOnly: boolean;
  /** Show the file menu, the settings, and the undo, redo, and layout controls. */
  toolbar: boolean;
  /** Show the text and inspector panels. */
  panels: boolean;
  /** Whether the assistant is enabled, which adds its panel. */
  assistant: boolean;
}

const ArgueConfigContext = createContext<ArgueConfig>({
  id: "arguemapper",
  readOnly: false,
  toolbar: false,
  panels: false,
  assistant: false,
});

export const ArgueConfigProvider: Context<ArgueConfig> = ArgueConfigContext;

export function useArgueConfig(): ArgueConfig {
  return useContext(ArgueConfigContext);
}
