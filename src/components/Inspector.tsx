import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback } from "react";
import { version as npmVersion } from "../../package.json";
import * as model from "../model.js";
import { setState, useStore } from "../store.js";
import AtomFields from "./inspector/AtomFields.js";
import EdgeFields from "./inspector/EdgeFields.js";
import GraphFields from "./inspector/GraphFields.js";
import SchemeFields from "./inspector/SchemeFields.js";

interface Props {
  close: () => void;
}

const Inspector: React.FC<Props> = ({ close }) => {
  const selectionType = useStore((state) => state.selection.type);
  const onDelete = useCallback(() => {
    setState((state) => ({
      nodes: state.nodes.filter(
        (_node, idx) => !state.selection.nodes.includes(idx)
      ),
      edges: state.edges.filter(
        (_edge, idx) => !state.selection.edges.includes(idx)
      ),
      selection: model.initSelection(),
    }));
  }, []);

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
              <IconButton onClick={close}>
                <FontAwesomeIcon icon={faXmark} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Toolbar>
      <Stack spacing={3} padding={3}>
        {selectionType === "atom" && <AtomFields />}
        {selectionType === "scheme" && <SchemeFields />}
        {selectionType === "edge" && <EdgeFields />}
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
        {selectionType !== "graph" && (
          <Button
            color="error"
            startIcon={<FontAwesomeIcon icon={faTrash} />}
            variant="contained"
            onClick={onDelete}
          >
            Delete selection
          </Button>
        )}
        {/* <Button
          variant="contained"
          onClick={() => {
            const transport = new GrpcWebFetchTransport({
              baseUrl: "http://envoy:5000",
            });
            const client = new nlpClient.NlpServiceClient(transport);
            const { response } = client.similarities({
              config: {
                language: "en",
                spacyModel: "en_core_web_lg",
                embeddingModels: [],
                similarityMethod: nlp.SimilarityMethod.COSINE,
              },
              textTuples: [
                { text1: "We are going to berlin", text2: "Eating is fun" },
              ],
            });
            response.then((value) => {
              console.log(value.similarities);
            });
          }}
        >
          gRPC
        </Button> */}
        <Stack direction="column">
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
          <Typography color="GrayText" align="center">
            v{npmVersion}
          </Typography>
        </Stack>
      </Stack>
    </>
  );
};

export default Inspector;
