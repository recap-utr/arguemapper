import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { startCase } from "es-toolkit";
import type React from "react";
import { useState } from "react";
import { version as npmVersion } from "@root/package.json";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useInspectorSlots, useStore } from "@/store.js";
import { AnalystDialog } from "@/components/sidebar/AnalystDialog.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

export const Configuration: React.FC<Props> = ({ onClose }) => {
  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);
  const edgeStyle = useStore((state) => state.edgeStyle);
  const prettifyJson = useStore((state) => state.prettifyJson);
  const imageScale = useStore((state) => state.imageScale);
  const slots = useInspectorSlots();
  const { readOnly } = useArgueConfig();
  const { setState } = useArgueActions();

  const [analystCallback, setAnalystCallback] = useState<(() => void) | undefined>(undefined);

  return (
    <>
      <SectionHeader title="Configuration" onClose={onClose} />
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={2}>
          <Button
            startIcon={<FontAwesomeIcon icon={faEdit} />}
            variant="contained"
            onClick={() => {
              setAnalystCallback(() => () => {
                /* edit only — no follow-up action */
              });
            }}
          >
            Edit Analyst
          </Button>
          <AnalystDialog
            callback={analystCallback}
            disableCallback={() => setAnalystCallback(undefined)}
          />
          <FormControl fullWidth disabled={readOnly}>
            <InputLabel>Layout</InputLabel>
            <Select
              value={layoutAlgorithm}
              label="Layout"
              onChange={(event) => {
                setState({
                  layoutAlgorithm: event.target.value as model.LayoutAlgorithm,
                  shouldLayout: true,
                });
              }}
            >
              {model.layoutAlgorithms
                .toSorted((alg1, alg2) => alg1.localeCompare(alg2))
                .map((alg) => (
                  <MenuItem key={alg} value={alg}>
                    {startCase(alg)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Edge Type</InputLabel>
            <Select
              value={edgeStyle}
              label="Edge Type"
              onChange={(event) => {
                setState({ edgeStyle: event.target.value as model.EdgeStyle });
              }}
            >
              {model.edgeStyles
                .toSorted((x1, x2) => x1.localeCompare(x2))
                .map((x) => (
                  <MenuItem key={x} value={x}>
                    {startCase(x)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
            label="Image Scaling Factor"
            value={imageScale}
            onChange={(event) => {
              setState({ imageScale: Number.parseInt(event.target.value) });
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={prettifyJson}
                onChange={(event) => {
                  setState({ prettifyJson: event.target.checked });
                }}
              />
            }
            label="Prettify JSON"
          />
          {!readOnly && slots.configuration}
        </Stack>

        <Stack sx={{ alignItems: "center", mt: 3 }}>
          <Tooltip describeChild title="Open GitHub repository">
            <IconButton
              component={Link}
              href="https://github.com/recap-utr/arguemapper"
              target="_blank"
              sx={{ ":hover": { backgroundColor: "transparent" } }}
            >
              <FontAwesomeIcon icon={faGithub} />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            v{npmVersion}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};

export default Configuration;
