import VisibilityIcon from "@mui/icons-material/Visibility";
import { Divider } from "@mui/material";
import { startCase } from "es-toolkit";
import type React from "react";
import { ToolbarMenu } from "@/components/canvas/Toolbar.js";
import { CheckMenuItem, MenuSubheader } from "@/components/MenuItems.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useWorkspace } from "@/store.js";

/** Menu for the look of the canvas, which stays open so that the options can be compared. */
export const ViewMenu: React.FC = () => {
  const layoutAlgorithm = useWorkspace((state) => state.layoutAlgorithm);
  const edgeStyle = useWorkspace((state) => state.edgeStyle);
  const guide = useWorkspace((state) => state.guide);
  const { guide: guideOffered } = useArgueConfig();
  const { setState, setWorkspace } = useArgueActions();

  return (
    <ToolbarMenu label="View" icon={VisibilityIcon}>
      <MenuSubheader>Arrangement</MenuSubheader>
      {model.layoutAlgorithms.map((algorithm) => (
        <CheckMenuItem
          key={algorithm}
          kind="radio"
          text={startCase(algorithm)}
          checked={algorithm === layoutAlgorithm}
          onClick={() => {
            setWorkspace({ layoutAlgorithm: algorithm });
            setState({ shouldLayout: true });
          }}
        />
      ))}
      <MenuSubheader>Connections</MenuSubheader>
      {model.edgeStyles.map((style) => (
        <CheckMenuItem
          key={style}
          kind="radio"
          text={startCase(style)}
          checked={style === edgeStyle}
          onClick={() => setWorkspace({ edgeStyle: style })}
        />
      ))}
      {guideOffered && (
        <>
          <Divider />
          <CheckMenuItem
            kind="checkbox"
            text="Getting started guide"
            checked={guide}
            onClick={() => setWorkspace({ guide: !guide })}
          />
        </>
      )}
    </ToolbarMenu>
  );
};
