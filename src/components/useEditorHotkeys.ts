import { type Keys, useHotkeys } from "react-hotkeys-hook";
import { useArgueConfig } from "@/store.js";

/**
 * Run the callback on the keys while the editor has the focus, or any editor while nothing has it,
 * so that several editors on a page do not react to the same keys.
 * Keys match the character they type, so the shortcuts follow the keyboard layout.
 */
export function useEditorHotkeys(keys: Keys, callback: () => void): void {
  const { rootRef } = useArgueConfig();
  const focused = () => {
    const active = document.activeElement;

    return (
      active === null || active === document.body || rootRef.current?.contains(active) === true
    );
  };

  useHotkeys(keys, callback, { enabled: focused, preventDefault: focused, useKey: true });
}
