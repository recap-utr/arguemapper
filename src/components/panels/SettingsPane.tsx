import GitHubIcon from "@mui/icons-material/GitHub";
import { Button, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import type React from "react";
import { version } from "@root/package.json";
import { type AssistantConfig, reasoningLevels } from "@/assistant/config.js";
import { settingsSections } from "@/components/panels/layout.js";
import { PanelBody } from "@/components/panels/PanelArea.js";
import { SelectField } from "@/components/SelectField.js";
import { useArgueActions, useArgueConfig, useWorkspace } from "@/store.js";

/** Name and email of the analyst, which downloaded Arguebuf files record. */
const AnalystFields: React.FC = () => {
  const analyst = useWorkspace((state) => state.analyst);
  const { setWorkspace } = useArgueActions();

  return (
    <>
      <TextField
        label="Your name"
        value={analyst.name ?? ""}
        onChange={(event) => {
          const name = event.target.value;
          setWorkspace((state) => ({ analyst: { ...state.analyst, name } }));
        }}
      />
      <TextField
        label="Your email"
        type="email"
        helperText="Recorded in downloaded Arguebuf files"
        value={analyst.email ?? ""}
        onChange={(event) => {
          const email = event.target.value;
          setWorkspace((state) => ({ analyst: { ...state.analyst, email } }));
        }}
      />
    </>
  );
};

/** Settings of the downloads from the file menu. */
const DownloadFields: React.FC = () => {
  const prettifyJson = useWorkspace((state) => state.prettifyJson);
  const imageScale = useWorkspace((state) => state.imageScale);
  const { readOnly } = useArgueConfig();
  const { setWorkspace } = useArgueActions();

  return (
    <>
      <Typography variant="overline">Downloads</Typography>
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
    </>
  );
};

/** Settings of the assistant that the host does not fix. */
const AssistantFields: React.FC = () => {
  const { assistant: fixed = {} } = useArgueConfig();
  const apiKey = useWorkspace((state) => state.assistantApiKey);
  const config = useWorkspace((state) => state.assistantConfig);
  const { setWorkspace } = useArgueActions();
  const setConfig = (changes: Partial<AssistantConfig>) =>
    setWorkspace({ assistantConfig: { ...config, ...changes } });

  return (
    <>
      <Typography variant="overline">Assistant</Typography>
      {fixed.apiKey === undefined && (
        <TextField
          type="password"
          label="API key"
          helperText="Optional, local models usually need none"
          value={apiKey}
          onChange={(event) => setWorkspace({ assistantApiKey: event.target.value })}
        />
      )}
      {fixed.model === undefined && (
        <TextField
          label="Model"
          value={config.model}
          onChange={(event) => setConfig({ model: event.target.value })}
        />
      )}
      {fixed.baseURL === undefined && (
        <TextField
          label="Base URL"
          value={config.baseURL}
          onChange={(event) => setConfig({ baseURL: event.target.value })}
        />
      )}
      {fixed.reasoning === undefined && (
        <SelectField
          label="Reasoning"
          value={config.reasoning}
          options={reasoningLevels}
          onChange={(reasoning) => setConfig({ reasoning })}
        />
      )}
    </>
  );
};

/** Settings of the workspace, which apply to all graphs and take effect right away. */
export const SettingsPane: React.FC = () => {
  const config = useArgueConfig();
  const sections = settingsSections(config);

  return (
    <PanelBody>
      {sections.downloads && <DownloadFields />}
      {sections.assistant && <AssistantFields />}
      {config.slots.settings}
      <Button
        href="https://github.com/recap-utr/arguemapper"
        target="_blank"
        startIcon={<GitHubIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        v{version}
      </Button>
    </PanelBody>
  );
};
