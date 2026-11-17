import DataObjectIcon from "@mui/icons-material/DataObject";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ImageIcon from "@mui/icons-material/Image";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import MenuIcon from "@mui/icons-material/Menu";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { Divider } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import type React from "react";
import { useRef } from "react";
import { ToolbarMenu } from "@/components/canvas/Toolbar.js";
import { IconMenuItem, MenuSubheader } from "@/components/MenuItems.js";
import { useEditorHotkeys } from "@/components/useEditorHotkeys.js";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { generateDemo } from "@/services/demo.js";
import { useArgueActions, useArgueConfig, useWorkspace } from "@/store.js";

/** Menu to start, open, and download graphs. */
export const FileMenu: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { readOnly, slots, wrapperRef } = useArgueConfig();
  const tabs = useWorkspace((state) => state.tabs);
  const flow = useReactFlow();
  const { getState, getWorkspace, openGraph, openPanel, notify } = useArgueActions();

  const downloadGraph = (format: convert.ExportFormat) => {
    const { analyst, prettifyJson } = getWorkspace();
    const { graph } = getState();
    convert.downloadJson(convert.exportGraph(graph, format, analyst), prettifyJson, graph.name);

    if (convert.recordsAnalyst(format) && !(analyst.name && analyst.email)) {
      notify(
        "Add your name and email in the settings to record them in downloaded files.",
        "info",
        {
          label: "Settings",
          run: () => openPanel("settings"),
        },
      );
    }
  };

  const downloadImage = (format: convert.ImgFormat) => {
    const element = wrapperRef.current;

    if (element) {
      void flow.fitView(model.fitViewOptions);
      void convert.downloadImage(format, {
        element,
        scale: getWorkspace().imageScale,
        name: getState().graph.name,
      });
    }
  };

  useEditorHotkeys("mod+s", () => downloadGraph("arguebuf"));

  return (
    <>
      <ToolbarMenu label="File" icon={MenuIcon}>
        {!readOnly && (
          <>
            <IconMenuItem icon={NoteAddIcon} text="New graph" onClick={() => openGraph()} />
            <IconMenuItem
              icon={FolderOpenIcon}
              text="Open file…"
              onClick={() => inputRef.current?.click()}
            />
            <IconMenuItem
              icon={LightbulbIcon}
              text="Load example"
              onClick={() => openGraph(generateDemo())}
            />
            {slots.fileMenu}
            <Divider />
          </>
        )}
        <MenuSubheader>Download as</MenuSubheader>
        <IconMenuItem
          icon={DataObjectIcon}
          text="Arguebuf (JSON, Ctrl+S)"
          onClick={() => downloadGraph("arguebuf")}
        />
        <IconMenuItem
          icon={DataObjectIcon}
          text="AIF (JSON)"
          onClick={() => downloadGraph("aif")}
        />
        <IconMenuItem icon={ImageIcon} text="PNG image" onClick={() => downloadImage("png")} />
        <IconMenuItem icon={ImageIcon} text="JPG image" onClick={() => downloadImage("jpg")} />
      </ToolbarMenu>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={convert.importSuffixes.join(",")}
        // the same file can be opened again
        onClick={(event) => {
          event.currentTarget.value = "";
        }}
        multiple={tabs}
        onChange={(event) => {
          for (const file of event.target.files ?? []) openGraph(file);
        }}
      />
    </>
  );
};
