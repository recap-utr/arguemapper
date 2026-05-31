import { faFileImage } from "@fortawesome/free-regular-svg-icons";
import {
  faDownload,
  faFileArrowUp,
  faFileCirclePlus,
  faFileCode,
  faFilePen,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import type React from "react";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { generateDemo } from "@/services/demo.js";
import {
  useArgueActions,
  useFlowWrapperRef,
  useInspectorSlots,
  useInstanceFocused,
  useStore,
} from "@/store.js";
import { AnalystDialog } from "@/components/sidebar/AnalystDialog.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

const Input = styled("input")({ display: "none" });

interface Props {
  onClose: () => void;
}

export const ImportExport: React.FC<Props> = ({ onClose }) => {
  const analyst = useStore((state) => state.analyst);
  const prettifyJson = useStore((state) => state.prettifyJson);
  const imageScale = useStore((state) => state.imageScale);
  const flow = useReactFlow();
  const wrapperRef = useFlowWrapperRef();
  const slots = useInspectorSlots();
  const focused = useInstanceFocused();
  const { getState, resetState } = useArgueActions();

  const [analystCallback, setAnalystCallback] = useState<(() => void) | undefined>(undefined);
  const disableAnalystCallback = () => {
    setAnalystCallback(undefined);
  };

  const getWrapper = useCallback((): model.Wrapper => {
    const state = getState();
    return { nodes: state.nodes, edges: state.edges, graph: state.graph };
  }, [getState]);

  const upload: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.target.files && event.target.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === "string") {
            resetState(convert.importGraph(JSON.parse(e.target.result)));
          }
        };
        reader.readAsText(event.target.files[0]);
      }
    },
    [resetState],
  );

  const verifyAnalyst = useCallback(
    (callback: () => void) => {
      if (!(analyst.name && analyst.email)) {
        setAnalystCallback(() => callback);
      } else {
        callback();
      }
    },
    [analyst],
  );

  const downloadGraph = useCallback(
    (format: "aif" | "arguebuf") => {
      convert.downloadJson(convert.exportGraph(getWrapper(), format, analyst), prettifyJson);
    },
    [getWrapper, analyst, prettifyJson],
  );

  const downloadGraphImage = useCallback(
    (format: convert.ImgFormat) => {
      const element = wrapperRef?.current ?? null;
      if (element !== null) {
        void convert.downloadImage(format, { element, pixelRatio: imageScale });
      }
    },
    [imageScale, wrapperRef],
  );

  useHotkeys(
    "mod+s",
    () => {
      verifyAnalyst(() => {
        downloadGraph("arguebuf");
      });
    },
    { preventDefault: true, useKey: true, enabled: focused },
  );

  return (
    <>
      <SectionHeader title="Import / Export" onClose={onClose} />
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              <FontAwesomeIcon icon={faUpload} />
              &nbsp;Import
            </Typography>
            <label htmlFor="upload-file-button">
              <Input
                accept="application/json"
                id="upload-file-button"
                type="file"
                // Reset the value after every upload so the same file can be uploaded twice.
                onClick={(event) => {
                  (event.target as HTMLInputElement).value = "";
                }}
                onChange={upload}
              />
              <Button
                startIcon={<FontAwesomeIcon icon={faFileArrowUp} />}
                variant="contained"
                component="span"
                fullWidth
              >
                Upload
              </Button>
            </label>
            <Button
              startIcon={<FontAwesomeIcon icon={faFileCirclePlus} />}
              variant="contained"
              onClick={() => {
                resetState();
              }}
            >
              Load Empty
            </Button>
            <Button
              startIcon={<FontAwesomeIcon icon={faFilePen} />}
              variant="contained"
              onClick={() => {
                resetState(generateDemo());
              }}
            >
              Load Demo
            </Button>
            {slots.import}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              <FontAwesomeIcon icon={faDownload} />
              &nbsp;Export
            </Typography>
            <Button
              startIcon={<FontAwesomeIcon icon={faFileCode} />}
              variant="contained"
              onClick={() => {
                verifyAnalyst(() => {
                  downloadGraph("arguebuf");
                });
              }}
            >
              Arguebuf
            </Button>
            <Button
              startIcon={<FontAwesomeIcon icon={faFileCode} />}
              variant="contained"
              onClick={() => {
                verifyAnalyst(() => {
                  downloadGraph("aif");
                });
              }}
            >
              AIF
            </Button>
            <Button
              startIcon={<FontAwesomeIcon icon={faFileImage} />}
              variant="contained"
              onClick={() => {
                void flow.fitView();
                downloadGraphImage(convert.ImgFormat.PNG);
              }}
            >
              PNG
            </Button>
            <Button
              startIcon={<FontAwesomeIcon icon={faFileImage} />}
              variant="contained"
              onClick={() => {
                void flow.fitView();
                downloadGraphImage(convert.ImgFormat.JPG);
              }}
            >
              JPG
            </Button>
          </Stack>
        </Stack>
        <AnalystDialog callback={analystCallback} disableCallback={disableAnalystCallback} />
      </Box>
    </>
  );
};

export default ImportExport;
