import { faFileImage } from "@fortawesome/free-regular-svg-icons";
import {
  faCaretDown,
  faDownload,
  faEdit,
  faFileArrowUp,
  faFileCirclePlus,
  faFileCode,
  faFilePen,
  faGear,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  styled,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import produce from "immer";
import { startCase } from "lodash";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback, useState } from "react";
import { useReactFlow } from "react-flow-renderer";
import * as model from "../../model";
import * as convert from "../../services/convert";
import demoGraph from "../../services/demo";
import useStore, { State } from "../../store";

const Input = styled("input")({
  display: "none",
});

export interface Props extends React.PropsWithChildren {}

export const GraphFields: React.FC<Props> = () => {
  const setState = useStore((state) => state.setState);
  const analyst = useStore((state) => state.analyst);
  const resetState = useStore((state) => state.resetState);

  const confirm = useConfirm();
  const flow = useReactFlow();

  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);

  // const [analystDialogOpen, setAnalystDialogOpen] = useState(false);
  const [analystCallback, setAnalystCallback] = useState<
    (() => void) | undefined
  >(undefined);
  const disableAnalystCallback = () => {
    setAnalystCallback(undefined);
  };

  const getState = () => {
    const state = useStore.getState();

    return {
      nodes: state.nodes,
      edges: state.edges,
      graph: state.graph,
    };
  };

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

  const verifyAnalyst = useCallback(
    (callback: () => void) => {
      if (!(analyst.name && analyst.email)) {
        setAnalystCallback(() => callback);
      } else {
        callback();
      }
    },
    [analyst]
  );

  const [expanded, setExpanded] = React.useState<string | false>("import");
  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  // const participantFields: {
  //   [x in keyof cytoModel.participant.Participant]?: string;
  // } = { name: "Name", email: "Email", username: "Username" };

  return (
    <>
      <div>
        <Accordion
          expanded={expanded === "import"}
          onChange={handleChange("import")}
        >
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
        <Accordion
          expanded={expanded === "export"}
          onChange={handleChange("export")}
        >
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
                  verifyAnalyst(() => {
                    convert.downloadJson(
                      convert.proto2json(convert.toProtobuf(getState()))
                    );
                  });
                }}
              >
                Arguebuf
              </Button>
              <Button
                startIcon={<FontAwesomeIcon icon={faFileCode} />}
                variant="contained"
                onClick={() => {
                  convert.downloadJson(convert.toAif(getState()));
                }}
              >
                AIF
              </Button>
              <Button
                startIcon={<FontAwesomeIcon icon={faFileImage} />}
                variant="contained"
                onClick={() => {
                  flow.fitView();
                  convert.downloadImage(convert.ImgFormat.PNG);
                }}
              >
                PNG
              </Button>
              <Button
                startIcon={<FontAwesomeIcon icon={faFileImage} />}
                variant="contained"
                onClick={() => {
                  flow.fitView();
                  convert.downloadImage(convert.ImgFormat.JPG);
                }}
              >
                JPG
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
        {/* <Accordion>
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
        <Accordion
          expanded={expanded === "configuration"}
          onChange={handleChange("configuration")}
        >
          <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown} />}>
            <Typography variant="h6">
              <FontAwesomeIcon icon={faGear} />
              &nbsp;Configuration
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Button
                startIcon={<FontAwesomeIcon icon={faEdit} />}
                variant="contained"
                onClick={() => {
                  setAnalystCallback(() => () => {});
                }}
              >
                Edit Analyst
              </Button>
              <AnalystDialog
                callback={analystCallback}
                disableCallback={disableAnalystCallback}
              />
              <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={layoutAlgorithm}
                  label="Layout"
                  onChange={(event) => {
                    setState({
                      layoutAlgorithm: event.target
                        .value as model.LayoutAlgorithm,
                      shouldLayout: true,
                    });
                  }}
                >
                  {Object.values(model.LayoutAlgorithm)
                    .sort((alg1, alg2) => alg1.localeCompare(alg2))
                    .map((alg) => (
                      <MenuItem key={alg} value={alg}>
                        {startCase(alg)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
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
            </Stack>
          </AccordionDetails>
        </Accordion>
      </div>
    </>
  );
};

interface AnalystDialogProps {
  callback: (() => void) | undefined;
  disableCallback: () => void;
}

const AnalystDialog: React.FC<AnalystDialogProps> = ({
  callback,
  disableCallback,
}) => {
  const setState = useStore((state) => state.setState);
  const analyst = useStore((state) => state.analyst);

  const callbackIsFunction = typeof callback === "function";
  const onClose = () => disableCallback();
  const onConfirm = () => {
    if (callbackIsFunction) {
      callback();
    }
    disableCallback();
  };

  const description = !(analyst.name && analyst.email)
    ? "Before exporting your work, you need to provide your name and email to be exported with the graph. Afterwards, click the export button again."
    : "Please enter your name and and email for storing together with the exported argument graph.";

  return (
    <Dialog open={callbackIsFunction} onClose={onClose}>
      <DialogTitle>Analyst Information</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        <TextField
          label="Name"
          fullWidth
          margin="dense"
          value={analyst.name ?? ""}
          onChange={(event) => {
            setState(
              produce((draft: State) => {
                draft.analyst.name = event.target.value;
              })
            );
          }}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="dense"
          value={analyst.email ?? ""}
          onChange={(event) => {
            setState(
              produce((draft: State) => {
                draft.analyst.email = event.target.value;
              })
            );
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          onClick={() => {
            setState({ analyst: model.initAnalyst({}) });
          }}
        >
          Clear
        </Button>
        <Button onClick={onConfirm}>Save and close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GraphFields;
