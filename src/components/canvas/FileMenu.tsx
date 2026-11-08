import {
  faBars,
  faFile,
  faFileCode,
  faFileImage,
  faFolderOpen,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Divider, ListSubheader, Menu } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import type React from "react";
import { Fragment, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAnalystGuard } from "@/components/AnalystDialog.js";
import { useGraphRender } from "@/components/GraphRenderContext.js";
import { IconMenuItem } from "@/components/IconMenuItem.js";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { generateDemo } from "@/services/demo.js";
import {
  useArgueActions,
  useArgueConfig,
  useFlowWrapperRef,
  useInstanceFocused,
  useSlots,
  useWorkspace,
} from "@/store.js";

/** Menu to start, open, and download graphs. */
export const FileMenu: React.FC = () => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { readOnly } = useArgueConfig();
  const tabs = useWorkspace((state) => state.tabs);
  const { coarse } = useGraphRender();
  const slots = useSlots();
  const flow = useReactFlow();
  const wrapperRef = useFlowWrapperRef();
  const focused = useInstanceFocused();
  const { getState, getWorkspace, openGraph } = useArgueActions();
  const [guard, analystDialog] = useAnalystGuard();

  const downloadGraph = (format: convert.ExportFormat) => {
    const download = () => {
      const { analyst, prettifyJson } = getWorkspace();
      const { graph } = getState();
      convert.downloadJson(convert.exportGraph(graph, format, analyst), prettifyJson, graph.name);
    };

    if (convert.recordsAnalyst(format)) {
      guard(download);
    } else {
      download();
    }
  };

  const downloadImage = (format: convert.ImgFormat) => {
    const element = wrapperRef?.current;

    if (element) {
      void flow.fitView(model.fitViewOptions);
      void convert.downloadImage(format, {
        element,
        scale: getWorkspace().imageScale,
        name: getState().graph.name,
      });
    }
  };

  useHotkeys("mod+s", () => downloadGraph("arguebuf"), {
    preventDefault: true,
    useKey: true,
    enabled: focused,
  });

  return (
    <>
      <Button
        size={coarse ? "large" : "medium"}
        startIcon={<FontAwesomeIcon icon={faBars} />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        File
      </Button>
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
      {/* clicks on items bubble up and close the menu, it stays mounted for dialogs of the slots */}
      <Menu
        keepMounted
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        onClick={() => setAnchor(null)}
      >
        {!readOnly && [
          <IconMenuItem key="new" icon={faFile} text="New graph" onClick={() => openGraph()} />,
          <IconMenuItem
            key="open"
            icon={faFolderOpen}
            text="Open file…"
            onClick={() => inputRef.current?.click()}
          />,
          <IconMenuItem
            key="example"
            icon={faLightbulb}
            text="Load example"
            onClick={() => openGraph(generateDemo())}
          />,
          <Fragment key="slots">{slots.fileMenu}</Fragment>,
          <Divider key="divider" />,
        ]}
        {/* sticky headers take on the elevation tint of the menu they are on */}
        <ListSubheader sx={{ backgroundImage: "var(--Paper-overlay)" }}>Download as</ListSubheader>
        <IconMenuItem
          icon={faFileCode}
          text="Arguebuf (JSON, Ctrl+S)"
          onClick={() => downloadGraph("arguebuf")}
        />
        <IconMenuItem icon={faFileCode} text="AIF (JSON)" onClick={() => downloadGraph("aif")} />
        <IconMenuItem icon={faFileImage} text="PNG image" onClick={() => downloadImage("png")} />
        <IconMenuItem icon={faFileImage} text="JPG image" onClick={() => downloadImage("jpg")} />
      </Menu>
      {analystDialog}
    </>
  );
};
