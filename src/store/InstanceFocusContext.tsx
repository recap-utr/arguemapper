import {
  type Context,
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useState,
} from "react";

// True when this instance should receive global keyboard shortcuts. Defaults to true so a single
// instance (or a consumer that doesn't wrap with the provider) keeps working.
const InstanceFocusContext = createContext<boolean>(true);

export const InstanceFocusProvider: Context<boolean> = InstanceFocusContext;

export function useInstanceFocused(): boolean {
  return useContext(InstanceFocusContext);
}

/**
 * Track whether keyboard focus is within `ref`'s subtree, so each instance's hotkeys only fire when
 * it is the active one. Treats "nothing focused" (document body) as focused too, so a lone instance
 * responds without an explicit click while multiple instances still don't cross-fire once one is
 * focused.
 */
export function useFocusWithin(ref: RefObject<HTMLElement | null>): boolean {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    const update = () => {
      const root = ref.current;
      const active = document.activeElement;
      setFocused(
        root === null || active === null || active === document.body || root.contains(active),
      );
    };

    update();
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, [ref]);

  return focused;
}
