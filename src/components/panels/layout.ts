import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faFileLines, faRobot, faSliders } from "@fortawesome/free-solid-svg-icons";
import { useMediaQuery, useTheme } from "@mui/material";
import { type Panel, useArgueActions, useArgueConfig, useStore } from "@/store.js";

export const PANELS: Readonly<Record<Panel, { label: string; icon: IconProp }>> = {
  text: { label: "Text", icon: faFileLines },
  inspector: { label: "Details", icon: faSliders },
  assistant: { label: "Assistant", icon: faRobot },
};

/** Panels that share an area beside the canvas on wide screens. */
const AREAS: readonly (readonly Panel[])[] = [["text"], ["inspector", "assistant"]];

export interface PanelLayout {
  /** Wide screens show the panels beside the canvas, narrow ones below it. */
  wide: boolean;
  /** The panels of this editor, without the assistant if it is disabled. */
  available: Panel[];
  /** The areas of panels, beside the canvas on wide screens and a single one below it otherwise. */
  areas: readonly (readonly Panel[])[];
  /** The panel shown in each area, if any. */
  shown: (area: readonly Panel[]) => Panel | undefined;
  isShown: (panel: Panel) => boolean;
  /** Hide the panel together with the others of its area. */
  hide: (panel: Panel) => void;
}

/** Which panels are shown where, shared by the layout, the panel toggles, and the panels. */
export function usePanelLayout(): PanelLayout {
  const wide = useMediaQuery(useTheme().breakpoints.up("md"));
  const panels = useStore((state) => state.panels);
  const { assistant } = useArgueConfig();
  const { closePanels } = useArgueActions();
  const available: Panel[] = assistant ? ["text", "inspector", "assistant"] : ["text", "inspector"];
  const areas = (wide ? AREAS : [available]).map((area) =>
    area.filter((panel) => available.includes(panel)),
  );
  const shown = (area: readonly Panel[]) => panels.findLast((panel) => area.includes(panel));
  const areaOf = (panel: Panel) => areas.find((area) => area.includes(panel)) ?? [panel];

  return {
    wide,
    available,
    areas,
    shown,
    isShown: (panel) => shown(areaOf(panel)) === panel,
    hide: (panel) => closePanels(...areaOf(panel)),
  };
}
