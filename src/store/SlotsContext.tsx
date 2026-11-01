import { type Context, createContext, type ReactNode, useContext } from "react";

/** Host content added to the editor, e.g. by the standalone app. */
export interface EditorSlots {
  /** Menu items appended to the file menu, e.g. further import sources. */
  fileMenu?: ReactNode;
  /** Content appended to the settings dialog. */
  settings?: ReactNode;
}

const SlotsContext = createContext<EditorSlots>({});

export const SlotsProvider: Context<EditorSlots> = SlotsContext;

export function useSlots(): EditorSlots {
  return useContext(SlotsContext);
}
