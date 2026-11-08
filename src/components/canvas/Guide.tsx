import ArticleIcon from "@mui/icons-material/Article";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { Panel } from "@xyflow/react";
import type React from "react";
import { useState } from "react";
import { shallow } from "zustand/shallow";
import { usePanelLayout } from "@/components/panels/layout.js";
import type * as model from "@/model.js";
import { generateDemo } from "@/services/demo.js";
import { useArgueActions, useArgueConfig, useDocument, useWorkspace } from "@/store.js";

interface GuideStep {
  id: "text" | "claims" | "relations" | "majorClaim";
  label: string;
  hint: string;
  /** Whether the step needs the text panel. */
  text: boolean;
  done: (graph: model.Graph) => boolean;
}

const STEPS: readonly GuideStep[] = [
  {
    id: "text",
    label: "Add a text",
    hint: "Paste the text you want to analyze into the text panel.",
    text: true,
    done: (graph) => Object.values(graph.resources).some((resource) => resource.text.trim() !== ""),
  },
  {
    id: "claims",
    label: "Turn passages into claims",
    hint: "Select a passage of the text and choose “Add claim”. Repeat this for every claim the text makes.",
    text: true,
    done: (graph) => Object.values(graph.nodes).some((node) => node.type === "atom"),
  },
  {
    id: "relations",
    label: "Connect the claims",
    hint: "Drag from the dot of one claim to another. The new relation supports the claim, select it to change it to an attack.",
    text: false,
    done: (graph) => Object.values(graph.nodes).some((node) => node.type === "scheme"),
  },
  {
    id: "majorClaim",
    label: "Mark the main claim",
    hint: "Select the claim that the whole text argues for and press the star above it.",
    text: false,
    done: (graph) => graph.majorClaim !== undefined,
  },
];

/** The step the guide shows, undefined while it is hidden or done. */
export function useGuideStep(): GuideStep["id"] | undefined {
  const shown = useWorkspace((state) => state.guide);
  const { readOnly } = useArgueConfig();

  return useDocument((state) =>
    shown && !readOnly ? STEPS.find((step) => !step.done(state.graph))?.id : undefined,
  );
}

/**
 * Steps from a text to an argument graph, checked off as the graph grows.
 * It is shown on the canvas until all steps are done or the user hides it.
 */
export const Guide: React.FC = () => {
  const shown = useWorkspace((state) => state.guide);
  const { readOnly } = useArgueConfig();

  // the steps are only checked while the guide may be shown
  return shown && !readOnly ? <GuideCard /> : null;
};

const GuideCard: React.FC = () => {
  const completed = useDocument((state) => STEPS.map((step) => step.done(state.graph)), shallow);
  const { wide, available, isShown } = usePanelLayout();
  // collapsed while a panel covers half of a narrow canvas, unless the user chose otherwise
  const [expanded, setExpanded] = useState<boolean>();
  const auto = wide || !available.some(isShown);
  const { setWorkspace, openPanel, notify, openGraph } = useArgueActions();
  const active = completed.indexOf(false);

  if (active === -1) {
    return null;
  }

  const hide = () => {
    setWorkspace({ guide: false });
    notify("You can show the guide again in the settings.", "info");
  };

  return (
    <Panel
      position={wide ? "bottom-right" : "top-center"}
      style={{ marginTop: wide ? undefined : 80, width: "min(360px, calc(100% - 30px))" }}
    >
      <Accordion
        expanded={expanded ?? auto}
        onChange={(_event, value) => setExpanded(value)}
        elevation={4}
        disableGutters
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            Getting started · {completed.filter(Boolean).length} of {STEPS.length} done
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stepper activeStep={active} orientation="vertical">
            {STEPS.map((step, index) => (
              <Step key={step.label} completed={completed[index]}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.hint}
                  </Typography>
                  {step.text && !isShown("text") && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<ArticleIcon />}
                      onClick={() => openPanel("text")}
                      sx={{ mt: 1 }}
                    >
                      Open the text panel
                    </Button>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
          <Stack direction="row" sx={{ justifyContent: "space-between", mt: 2 }}>
            <Button
              size="small"
              startIcon={<LightbulbIcon />}
              onClick={() => openGraph(generateDemo())}
            >
              See an example
            </Button>
            <Button size="small" color="inherit" onClick={hide}>
              Hide guide
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Panel>
  );
};
