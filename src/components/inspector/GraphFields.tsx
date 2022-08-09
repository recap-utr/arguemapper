import {
  faCaretDown,
  faDownload,
  faFileArrowUp,
  faFileCirclePlus,
  faFileCode,
  faFilePen,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback } from "react";
import * as model from "../../model";
import * as convert from "../../services/convert";
import demoGraph from "../../services/demo";
import useStore from "../../store";

const Input = styled("input")({
  display: "none",
});

export interface Props extends React.PropsWithChildren {}

export const GraphFields: React.FC<Props> = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const graph = useStore((state) => state.graph);
  const resetState = useStore((state) => state.resetState);

  const confirm = useConfirm();
  // const theme = useTheme();

  const state = { nodes, edges, graph };

  const upload: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.target.files && event.target.files.length > 0) {
        // https://stackoverflow.com/a/30992506
        var reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === "string") {
            const parsedGraph = JSON.parse(e.target.result);
            confirm().then(() => {
              resetState(convert.importGraph(parsedGraph));
            });
          }
        };

        reader.readAsText(event.target.files[0]);
      }
    },
    [confirm, resetState]
  );

  // const participantFields: {
  //   [x in keyof cytoModel.participant.Participant]?: string;
  // } = { name: "Name", email: "Email", username: "Username" };

  return (
    <>
      <div>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown} />}>
            <Typography variant="h6">
              <FontAwesomeIcon icon={faUpload} />
              &nbsp;Import
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <label htmlFor="upload-file-button">
                <Input
                  accept="text/json"
                  id="upload-file-button"
                  type="file"
                  // Reset the value after every upload so that the user can upload the same file twice.
                  // https://stackoverflow.com/a/40429197
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
                  confirm().then(() => {
                    resetState();
                  });
                }}
              >
                Load Empty
              </Button>
              <Button
                startIcon={<FontAwesomeIcon icon={faFilePen} />}
                variant="contained"
                onClick={() => {
                  confirm().then(() => {
                    resetState(demoGraph());
                  });
                }}
              >
                Load Demo
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown} />}>
            <Typography variant="h6">
              <FontAwesomeIcon icon={faDownload} />
              &nbsp;Export
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <Button
                startIcon={<FontAwesomeIcon icon={faFileCode} />}
                variant="contained"
                onClick={() => {
                  convert.downloadJson(
                    convert.proto2json(model.toProtobuf(state))
                  );
                }}
              >
                Arguebuf
              </Button>
              <Button
                startIcon={<FontAwesomeIcon icon={faFileCode} />}
                variant="contained"
                onClick={() => {
                  convert.downloadJson(model.toAif(state));
                }}
              >
                AIF
              </Button>
              {/* <Button
                startIcon={<FontAwesomeIcon icon={faFileImage} />}
                variant="contained"
                onClick={() => {
                  // TODO: Download PNG
                }}
              >
                PNG
              </Button>
              <Button
                startIcon={<FontAwesomeIcon icon={faFileImage} />}
                variant="contained"
                onClick={() => {
                  // TODO: Download JPG
                }}
              >
                JPG
              </Button> */}
              {/* {theme.palette.mode === "dark" && (
                <Typography variant="caption">
                  <b>Please note:</b>
                  <br />
                  The rendering respects dark mode. If you want a white
                  background, please switch to light mode.
                </Typography>
              )} */}
            </Stack>
          </AccordionDetails>
        </Accordion>
        {/* <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<FontAwesomeIcon icon={faCaretDown} />}
            >
              <Typography variant="h6">
                <FontAwesomeIcon icon={faUpload} />
                &nbsp;Participants
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {Object.entries(graph.participants).map(([id, participant]) => (
                  <Accordion key={id}>
                    <AccordionSummary>
                      <Typography variant="h6">{participant.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {Object.entries(participantFields).map(
                          ([attr, label]) => (
                            <TextField
                              fullWidth
                              key={attr}
                              label={label}
                              value={
                                participant[attr as keyof model.Participant]
                              }
                              onChange={(event) => {}}
                            />
                          )
                        )}
                        <Button
                          startIcon={<FontAwesomeIcon icon={faMinusCircle} />}
                          color="error"
                          variant="contained"
                          onClick={() => {
                            setState(
                              produce((draft) => {
                                delete draft.graph.participants[id];
                              })
                            );
                          }}
                        >
                          Remove Participant
                        </Button>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
                <Button
                  startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
                  variant="contained"
                  onClick={() => {
                    setState(
                      produce((draft) => {
                        draft.graph.participants[model.uuid()] =
                          model.initParticipant({
                            name: "Unknown",
                          });
                      })
                    );
                  }}
                >
                  Add Participant
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion> */}
      </div>
      <Tooltip
        title="If errors occur, you can clear your browser's cache and reload the page with this button"
        describeChild
      >
        <Button
          color="error"
          startIcon={<FontAwesomeIcon icon={faTrash} />}
          variant="contained"
          onClick={() => {
            confirm().then(() => {
              localStorage.clear();
              window.location.reload();
            });
          }}
        >
          Clear cache
        </Button>
      </Tooltip>
    </>
  );
};

export default GraphFields;
