import { type Breakpoint, useTheme } from "@mui/material";
import { type RefObject, useLayoutEffect, useState } from "react";
import { useArgueConfig } from "@/store.js";

/**
 * The largest breakpoint of the theme that the element is as wide as,
 * so an embedded editor adapts to its own width instead of the one of the screen.
 */
export function useContainerBreakpoint(ref: RefObject<HTMLElement | null>): Breakpoint {
  const { keys, values } = useTheme().breakpoints;
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("xl");

  // measured before painting, so the layout of a narrow editor does not flash
  useLayoutEffect(() => {
    const element = ref.current;

    if (element === null) {
      return;
    }

    const update = () =>
      setBreakpoint(keys.findLast((key) => element.clientWidth >= values[key]) ?? keys[0]);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, keys, values]);

  return breakpoint;
}

/** Whether the editor is at least as wide as the breakpoint, like `breakpoints.up` for the screen. */
export function useEditorUp(key: Breakpoint): boolean {
  const { values } = useTheme().breakpoints;
  const { breakpoint } = useArgueConfig();

  return values[breakpoint] >= values[key];
}
