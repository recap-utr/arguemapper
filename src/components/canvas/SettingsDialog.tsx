import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { startCase } from "es-toolkit";
import type React from "react";
import { useState } from "react";
import { version } from "@root/package.json";
import { AnalystFields } from "@/components/AnalystDialog.js";
import { ToolbarButton } from "@/components/canvas/SelectionToolbar.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useSlots, useStore } from "@/store.js";

/** Button that opens the settings of the editor. */
export const SettingsButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);
  const edgeStyle = useStore((state) => state.edgeStyle);
  const prettifyJson = useStore((state) => state.prettifyJson);
  const imageScale = useStore((state) => state.imageScale);
  const guide = useStore((state) => state.guide);
  const { readOnly } = useArgueConfig();
  const slots = useSlots();
  const { setState } = useArgueActions();

  return (
    <>
      <ToolbarButton title="Settings" icon={faGear} onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={() => setOpen(false)} fullScreen={fullScreen} fullWidth maxWidth="xs">
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant="overline">Display</Typography>
            {!readOnly && (
              <FormControlLabel
                control={
                  <Switch
                    checked={guide}
                    onChange={(event) => setState({ guide: event.target.checked })}
                  />
                }
                label="Getting started guide"
              />
            )}
            <TextField
              select
              label="Arrangement"
              value={layoutAlgorithm}
              onChange={(event) =>
                setState({
                  layoutAlgorithm: event.target.value as model.LayoutAlgorithm,
                  shouldLayout: true,
                })
              }
            >
              {model.layoutAlgorithms.map((algorithm) => (
                <MenuItem key={algorithm} value={algorithm}>
                  {startCase(algorithm)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Connection style"
              value={edgeStyle}
              onChange={(event) => setState({ edgeStyle: event.target.value as model.EdgeStyle })}
            >
              {model.edgeStyles.map((style) => (
                <MenuItem key={style} value={style}>
                  {startCase(style)}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="overline">Export</Typography>
            {!readOnly && <AnalystFields />}
            <TextField
              type="number"
              label="Image resolution"
              helperText="Multiple of the screen resolution"
              value={imageScale}
              slotProps={{ htmlInput: { min: 1, max: 10 } }}
              onChange={(event) => setState({ imageScale: Number(event.target.value) })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={prettifyJson}
                  onChange={(event) => setState({ prettifyJson: event.target.checked })}
                />
              }
              label="Readable JSON files"
            />
            {slots.settings}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            href="https://github.com/recap-utr/arguemapper"
            target="_blank"
            startIcon={<FontAwesomeIcon icon={faGithub} />}
            sx={{ mr: "auto" }}
          >
            v{version}
          </Button>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
