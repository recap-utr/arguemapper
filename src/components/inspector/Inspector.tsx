import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Stack, Typography } from "@mui/material";
import type React from "react";
import { AtomFields } from "@/components/inspector/AtomFields.js";
import { EdgeFields } from "@/components/inspector/EdgeFields.js";
import { GraphFields } from "@/components/inspector/GraphFields.js";
import { SchemeFields } from "@/components/inspector/SchemeFields.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";

/** Details of the selected elements, or of the graph if nothing is selected. */
const Inspector: React.FC = () => {
  const selectionType = useStore((state) => model.selectionType(state.graph, state.selection));
  const count = useStore(({ selection }) => selection.nodes.length + selection.edges.length);
  const { readOnly } = useArgueConfig();
  const { deleteSelection } = useArgueActions();

  return (
    <Stack spacing={2} sx={{ p: 2, flex: "1 1 0", minHeight: 0, overflowY: "auto" }}>
      {selectionType === "graph" && <GraphFields />}
      {selectionType === "atom" && <AtomFields />}
      {selectionType === "schemes" && <SchemeFields />}
      {selectionType === "edge" && <EdgeFields />}
      {selectionType === "multiple" && (
        <Typography color="text.secondary">
          {count} elements selected. Select a single one to edit it.
        </Typography>
      )}
      {selectionType !== "graph" && !readOnly && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<FontAwesomeIcon icon={faTrash} />}
          onClick={deleteSelection}
        >
          Delete
        </Button>
      )}
    </Stack>
  );
};

export default Inspector;
