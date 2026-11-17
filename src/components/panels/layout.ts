import type { SvgIconComponent } from "@mui/icons-material";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import TuneIcon from "@mui/icons-material/Tune";
import { hasEditableSettings } from "@/assistant/config.js";
import { useEditorUp } from "@/components/breakpoints.js";
import {
  allPanels,
  type ArgueConfig,
  type Panel,
  useArgueActions,
  useArgueConfig,
  useWorkspace,
} from "@/store.js";

export const PANELS: Readonly<Record<Panel, { label: string; icon: SvgIconComponent }>> = {
  text: { label: "Text", icon: ArticleIcon },
  inspector: { label: "Details", icon: TuneIcon },
  assistant: { label: "Assistant", icon: SmartToyIcon },
  settings: { label: "Settings", icon: SettingsIcon },
};

/** The sections of the settings panel that the configuration of the editor provides. */
export const settingsSections = ({
  toolbar,
  panels,
  assistant,
  slots,
}: ArgueConfig): Readonly<Record<"downloads" | "assistant" | "host", boolean>> => ({
  downloads: toolbar,
  // edited where its panel is
  assistant: panels && hasEditableSettings(assistant),
  host: slots.settings !== undefined,
});

/** Panels that share an area beside the canvas of wide editors. */
const AREAS: readonly (readonly Panel[])[] = [["text"], ["inspector", "assistant", "settings"]];

export interface PanelLayout {
  /** Wide editors show the panels beside the canvas, narrow ones below it. */
  wide: boolean;
  /** The panels enabled by the configuration of the editor. */
  available: Panel[];
  /**
   * The areas of panels, beside the canvas of wide editors and a single one below it otherwise.
   * Areas without available panels are empty.
   */
  areas: readonly (readonly Panel[])[];
  /** The panel shown in each area, if any. */
  shown: (area: readonly Panel[]) => Panel | undefined;
  isShown: (panel: Panel) => boolean;
  /** Hide the panel together with the others of its area. */
  hide: (panel: Panel) => void;
}

/** Which panels are shown where, shared by the layout, the panel toggles, and the panels. */
export function usePanelLayout(): PanelLayout {
  const panels = useWorkspace((state) => state.panels);
  const config = useArgueConfig();
  const { panels: content, assistant } = config;
  const wide = useEditorUp("md");
  const { closePanels } = useArgueActions();
  const enabled: Record<Panel, boolean> = {
    text: content,
    inspector: content,
    assistant: content && assistant !== undefined,
    settings: Object.values(settingsSections(config)).some(Boolean),
  };
  const available = allPanels.filter((panel) => enabled[panel]);
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
