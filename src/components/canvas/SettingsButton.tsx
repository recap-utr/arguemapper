import GitHubIcon from "@mui/icons-material/GitHub";
import SettingsIcon from "@mui/icons-material/Settings";
import { Button, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { version } from "@root/package.json";
import { AnalystFields } from "@/components/AnalystDialog.js";
import { BaseDialog } from "@/components/BaseDialog.js";
import { ToolbarButton } from "@/components/canvas/Toolbar.js";
import { SelectField } from "@/components/SelectField.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useWorkspace } from "@/store.js";

/** Button that opens the settings of the editor. */
export const SettingsButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const layoutAlgorithm = useWorkspace((state) => state.layoutAlgorithm);
  const edgeStyle = useWorkspace((state) => state.edgeStyle);
  const prettifyJson = useWorkspace((state) => state.prettifyJson);
  const imageScale = useWorkspace((state) => state.imageScale);
  const guide = useWorkspace((state) => state.guide);
  const { readOnly, guide: guideOffered, slots } = useArgueConfig();
  const { setState, setWorkspace } = useArgueActions();
  const close = () => setOpen(false);

  return (
    <>
      <ToolbarButton title="Settings" icon={SettingsIcon} onClick={() => setOpen(true)} />
      <BaseDialog
        open={open}
        title="Settings"
        onClose={close}
        actions={
          <>
            <Button
              href="https://github.com/recap-utr/arguemapper"
              target="_blank"
              startIcon={<GitHubIcon />}
              sx={{ mr: "auto" }}
            >
              v{version}
            </Button>
            <Button variant="contained" onClick={close}>
              Done
            </Button>
          </>
        }
      >
        <Typography variant="overline">Display</Typography>
        {guideOffered && (
          <FormControlLabel
            control={
              <Switch
                checked={guide}
                onChange={(event) => setWorkspace({ guide: event.target.checked })}
              />
            }
            label="Getting started guide"
          />
        )}
        <SelectField
          label="Arrangement"
          value={layoutAlgorithm}
          options={model.layoutAlgorithms}
          onChange={(value) => {
            setWorkspace({ layoutAlgorithm: value });
            setState({ shouldLayout: true });
          }}
        />
        <SelectField
          label="Connection style"
          value={edgeStyle}
          options={model.edgeStyles}
          onChange={(value) => setWorkspace({ edgeStyle: value })}
        />
        <Typography variant="overline">Export</Typography>
        {!readOnly && <AnalystFields />}
        <TextField
          type="number"
          label="Image resolution"
          helperText="Multiple of the screen resolution"
          value={imageScale}
          slotProps={{ htmlInput: { min: 1, max: 10 } }}
          onChange={(event) => setWorkspace({ imageScale: Number(event.target.value) })}
        />
        <FormControlLabel
          control={
            <Switch
              checked={prettifyJson}
              onChange={(event) => setWorkspace({ prettifyJson: event.target.checked })}
            />
          }
          label="Readable JSON files"
        />
        {slots.settings}
      </BaseDialog>
    </>
  );
};
