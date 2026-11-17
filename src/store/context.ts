import type { Breakpoint } from "@mui/material";
import { type Context, createContext, type ReactNode, type RefObject, useContext } from "react";
import type { AssistantSettings } from "@/assistant/config.js";
import type { WorkspaceStore } from "@/store/types.js";

/** Host content added to the editor, e.g. by the standalone app. */
export interface EditorSlots {
  /** Menu items appended to the file menu, e.g. further import sources. */
  fileMenu?: ReactNode;
  /** Content appended to the settings panel. */
  settings?: ReactNode;
}

/** Configuration of the editor by its host, together with the environment of the editor. */
export interface ArgueConfig {
  /** Instance id that namespaces React Flow and its SVG markers, a generated one by default. */
  id?: string;
  /** When true, all editing is disabled (pure viewer). */
  readOnly: boolean;
  /** Show the file and view menus, the settings panel, and the undo, redo, and layout controls. */
  toolbar: boolean;
  /** Show the text and inspector panels, and the assistant panel if it is enabled. */
  panels: boolean;
  /** Offer the getting started guide, never while read-only. */
  guide: boolean;
  /**
   * The settings fixed by the host if the assistant is enabled, which adds its panel.
   * The user chooses the others in the settings of the assistant.
   */
  assistant?: Partial<AssistantSettings>;
  slots: EditorSlots;
  /** The largest breakpoint of the theme that the editor is as wide as. */
  breakpoint: Breakpoint;
  /** The root element of the editor, e.g. to scope its keyboard shortcuts. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** The React Flow wrapper element of the editor, e.g. for its geometry and the image export. */
  wrapperRef: RefObject<HTMLDivElement | null>;
}

const WorkspaceContext = createContext<WorkspaceStore | null>(null);
const ArgueConfigContext = createContext<ArgueConfig | null>(null);

export const WorkspaceProvider: Context<WorkspaceStore | null> = WorkspaceContext;
export const ArgueConfigProvider: Context<ArgueConfig | null> = ArgueConfigContext;

function useEditorContext<T>(context: Context<T | null>): T {
  const value = useContext(context);

  if (value === null) {
    throw new Error("Editor hooks must be used within a <GraphEditor> or <GraphWorkspace>.");
  }

  return value;
}

/** The store of the workspace of the editor. */
export const useWorkspaceApi = (): WorkspaceStore => useEditorContext(WorkspaceContext);

export const useArgueConfig = (): ArgueConfig => useEditorContext(ArgueConfigContext);
