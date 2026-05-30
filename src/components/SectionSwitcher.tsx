import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CircularProgress, Divider, IconButton, Stack, Tooltip } from "@mui/material";
import type React from "react";
import { useArgueActions, useArgueConfig, useStore } from "../store.js";
import { canvasButtonSx } from "./canvasControls.js";
import { type SectionMeta, SECTION_GROUPS } from "./sidebar/sections.js";

/** On-canvas switcher: each icon shows/hides its own pane; open panes stack in the sidebar. */
export const SectionSwitcher: React.FC = () => {
  const openSections = useStore((state) => state.sidebarSections);
  const assistantBusy = useStore((state) => state.assistantBusy);
  const { assistant } = useArgueConfig();
  const { toggleSidebarSection } = useArgueActions();

  const renderItem = ({ section, icon, label }: SectionMeta) => {
    if (section === "assistant" && !assistant) return null;
    const active = openSections.includes(section);
    const busy = section === "assistant" && assistantBusy;
    return (
      <Tooltip key={section} describeChild title={label} placement="left">
        <IconButton
          color={active ? "primary" : "default"}
          onClick={() => toggleSidebarSection(section)}
          sx={{ ...canvasButtonSx, ...(active && { bgcolor: "action.selected" }) }}
        >
          {busy ? <CircularProgress size={18} /> : <FontAwesomeIcon icon={icon} fixedWidth />}
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Stack direction="column" sx={{ alignItems: "center" }}>
      {SECTION_GROUPS.map((group, index) => (
        <Stack key={group[0].section} direction="column" sx={{ alignItems: "center" }}>
          {index > 0 && <Divider flexItem sx={{ my: 0.5 }} />}
          {group.map(renderItem)}
        </Stack>
      ))}
    </Stack>
  );
};

export default SectionSwitcher;
