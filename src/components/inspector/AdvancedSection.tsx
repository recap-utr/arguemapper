import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import type React from "react";

interface Props extends React.PropsWithChildren {
  title?: string;
  /** Id of the element, shown for reference. */
  id?: string;
}

/** Collapsed section for fields that are rarely needed. */
export const AdvancedSection: React.FC<Props> = ({ title = "More", id, children }) => (
  <Accordion variant="outlined" disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack spacing={2}>
        {children}
        {id !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
            ID: {id}
          </Typography>
        )}
      </Stack>
    </AccordionDetails>
  </Accordion>
);
