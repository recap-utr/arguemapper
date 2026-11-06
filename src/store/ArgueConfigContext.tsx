import type { Breakpoint } from "@mui/material";
import { type Context, createContext, useContext } from "react";
import type { AssistantSettings } from "@/store/types.js";

export interface ArgueConfig {
  /** Instance id; namespaces ReactFlow and the SVG arrow markers so instances don't collide. */
  id: string;
  /** When true, all editing is disabled (pure viewer). */
  readOnly: boolean;
  /** Show the file menu, the settings, and the undo, redo, and layout controls. */
  toolbar: boolean;
  /** Show the text and inspector panels. */
  panels: boolean;
  /**
   * The settings fixed by the host if the assistant is enabled, which adds its panel.
   * The user chooses the others in the settings of the assistant.
   */
  assistant?: Partial<AssistantSettings>;
  /** The largest breakpoint of the theme that the editor is as wide as. */
  breakpoint: Breakpoint;
}

const ArgueConfigContext = createContext<ArgueConfig>({
  id: "arguemapper",
  readOnly: false,
  toolbar: false,
  panels: false,
  breakpoint: "xl",
});

export const ArgueConfigProvider: Context<ArgueConfig> = ArgueConfigContext;

export function useArgueConfig(): ArgueConfig {
  return useContext(ArgueConfigContext);
}
