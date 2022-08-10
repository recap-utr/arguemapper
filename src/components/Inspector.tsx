import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import produce from "immer";
import React from "react";
import useStore, { State } from "../store";
import AtomFields from "./inspector/AtomFields";
import GraphFields from "./inspector/GraphFields";
import SchemeFields from "./inspector/SchemeFields";

interface Props {
  openSidebar: (value: boolean) => void;
}

const Inspector: React.FC<Props> = ({ openSidebar }) => {
  const selectionType = useStore((state) => state.selection.type);
  const setState = useStore((state) => state.setState);

  const deleteButton = (
    <Button
      color="error"
      startIcon={<FontAwesomeIcon icon={faTrash} />}
      variant="contained"
      onClick={() => {
        setState(
          produce((draft: State) => {
            draft.nodes = draft.nodes.filter(
              (_node, idx) => !draft.selection.nodes.includes(idx)
            );
            draft.edges = draft.edges.filter(
              (_edge, idx) => !draft.selection.edges.includes(idx)
            );
          })
        );
      }}
    >
      Delete selection
    </Button>
  );

  return (
    <>
      <Toolbar>
        <Stack
          direction="row"
          justifyContent="space-between"
          width={1}
          alignItems="center"
        >
          <Typography variant="h5">Inspector</Typography>
          {selectionType !== "graph" && (
            <Tooltip describeChild title="Close inspector for current element">
              <IconButton
                onClick={() => {
                  openSidebar(false);
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Toolbar>
      <Stack spacing={3} padding={3}>
        {selectionType === "atom" && <AtomFields />}
        {selectionType === "scheme" && <SchemeFields />}
        {selectionType === "graph" && <GraphFields />}
        {selectionType === "multiple" && (
          <>
            <Typography variant="h6">Multiple elements selected</Typography>
            <Typography variant="body1">
              Please select only one if you want to edit their values. You can
              still move multiple elements together in the canvas or delete
              them.
            </Typography>
          </>
        )}
        {selectionType !== "graph" && deleteButton}
      </Stack>
    </>
  );
};

export default Inspector;
