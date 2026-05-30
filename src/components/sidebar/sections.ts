import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleInfo,
  faFileLines,
  faGear,
  faRightLeft,
  faRobot,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { SidebarSection } from "../../store.js";

export interface SectionMeta {
  section: SidebarSection;
  icon: IconProp;
  label: string;
}

// Canonical order: content/people panes first, then file & app settings. The switcher renders a
// divider between the two groups; the sidebar stacks open panes in this exact order.
export const SECTION_GROUPS: SectionMeta[][] = [
  [
    { section: "inspector", icon: faCircleInfo, label: "Inspector" },
    { section: "resources", icon: faFileLines, label: "Resources" },
    { section: "participants", icon: faUsers, label: "Participants" },
    { section: "assistant", icon: faRobot, label: "Assistant" },
  ],
  [
    { section: "importExport", icon: faRightLeft, label: "Import / Export" },
    { section: "configuration", icon: faGear, label: "Configuration" },
  ],
];

export const SECTION_ORDER: SidebarSection[] = SECTION_GROUPS.flatMap((group) =>
  group.map((meta) => meta.section),
);
