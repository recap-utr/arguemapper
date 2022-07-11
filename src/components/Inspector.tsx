import {
  faCaretDown,
  faCommentDots,
  faDownload,
  faFileArrowUp,
  faFileCirclePlus,
  faFileCode,
  faFileImage,
  faFilePen,
  faTrash,
  faUpload,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  styled,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import produce from "immer";
import { startCase } from "lodash";
import { useConfirm } from "material-ui-confirm";
import React from "react";
import { useReactFlow } from "react-flow-renderer";
import * as model from "../model";
import * as convert from "../services/convert";
import demoGraph from "../services/demo";
import { useGraph } from "./GraphContext";

const NULL_VALUE = "###NULL###";

const Input = styled("input")({
  display: "none",
});

interface Props {
  openSidebar: (value: boolean) => void;
}

const Inspector: React.FC<Props> = ({ openSidebar }) => {
  const {
    selection,
    setState,
    state,
    nodes,
    edges,
    setNodes,
    setEdges,
    clearCache,
    setGraph,
    graph,
    resetState,
  } = useGraph();
  const confirm = useConfirm();
  const theme = useTheme();
  const flow = useReactFlow();

  const selectionType = model.selectionType(selection);

  // useEffect(() => {
  //   if (cy) {
  //     setElement(cy.data());

  //     cy.on("select", (e) => {
  //       openSidebar(true);
  //       setModifiedAttributes([]);

  //       if (cy.$(":selected").length === 1) {
  //         setElement(e.target.data());
  //       } else {
  //         setElement(null);
  //       }
  //     });

  //     cy.on("unselect", () => {
  //       if (cy.$(":selected").length === 0) {
  //         openSidebar(false);
  //         setModifiedAttributes([]);
  //         setElement(cy.data());
  //       }
  //     });
  //     cy.on("remove", () => {
  //       openSidebar(false);
  //       cy.elements().selectify();
  //       cy.elements().unselect();
  //       setModifiedAttributes([]);
  //       setElement(cy.data());
  //     });
  //   }
  // }, [cy, openSidebar]);

  let fields = null;

  const deleteButton = (
    <Button
      color="error"
      startIcon={<FontAwesomeIcon icon={faTrash} />}
      variant="contained"
      onClick={() => {
        setState(
          produce((draft) => {
            draft.nodes = draft.nodes.filter(
              (node) => !(node.id in selection.nodes.map((x) => x.id))
            );
            draft.edges = draft.edges.filter(
              (edge) => !(edge.id in selection.edges.map((x) => x.id))
            );
          })
        );
      }}
    >
      Delete selection
    </Button>
  );

  // const participantFields: {
  //   [x in keyof cytoModel.participant.Participant]?: string;
  // } = { name: "Name", email: "Email", username: "Username" };

  if (selectionType === "scheme") {
    const element = selection.nodes[0] as model.SchemeNode;
    const schemeType = element.data.scheme?.type ?? NULL_VALUE;

    fields = (
      <>
        <FormControl fullWidth>
          <InputLabel>Scheme Type</InputLabel>
          <Select
            value={schemeType}
            label="Scheme Type"
            onChange={(event) => {}}
            defaultValue={NULL_VALUE}
          >
            <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
            {Object.entries(model.SchemeType).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {startCase(value)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {schemeType && schemeType !== NULL_VALUE && (
          <FormControl fullWidth>
            <InputLabel>Argumentation Scheme</InputLabel>
            <Select
              value={element.data.scheme?.value ?? NULL_VALUE}
              label="Argumentation Scheme"
              onChange={(event) => {}}
              defaultValue={NULL_VALUE}
            >
              {Object.entries(model.schemeMap[schemeType]).map(
                ([key, value]) => {
                  return (
                    <MenuItem key={key} value={value}>
                      {value}
                    </MenuItem>
                  );
                }
              )}
            </Select>
          </FormControl>
        )}
        {deleteButton}
      </>
    );
  } else if (selectionType === "atom") {
    const element = selection.nodes[0] as model.AtomNode;

    fields = (
      <>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Text"
          value={element.data.text}
          onChange={(event) => {}}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Original Text"
          value={element.data.reference?.text}
          onChange={(event) => {}}
        />
        <Button
          startIcon={<FontAwesomeIcon icon={faCommentDots} />}
          variant="contained"
          onClick={() => {
            setState(
              produce((draft) => {
                draft.graph.majorClaim = element.id;
              })
            );
          }}
        >
          Set as Major Claim
        </Button>
        {deleteButton}
      </>
    );
  } else if (selectionType === "graph") {
    fields = (
      <>
        <div>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<FontAwesomeIcon icon={faCaretDown} />}
            >
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
                    // TODO: Properly handle the else branches of the conditions
                    onChange={(event) => {
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
                    }}
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
            <AccordionSummary
              expandIcon={<FontAwesomeIcon icon={faCaretDown} />}
            >
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
                <Button
                  startIcon={<FontAwesomeIcon icon={faFileImage} />}
                  variant="contained"
                  onClick={() => {
                    // if (cy) {
                    //   downloadBlob(
                    //     cy.png({ output: "blob", scale: 2, full: true }),
                    //     ".png"
                    //   );
                    // }
                  }}
                >
                  PNG
                </Button>
                <Button
                  startIcon={<FontAwesomeIcon icon={faFileImage} />}
                  variant="contained"
                  onClick={() => {
                    // if (cy) {
                    //   downloadBlob(
                    //     cy.jpg({
                    //       output: "blob",
                    //       scale: 2,
                    //       full: true,
                    //       quality: 1,
                    //       bg: theme.palette.background.default,
                    //     }),
                    //     ".jpg"
                    //   );
                    // }
                  }}
                >
                  JPG
                </Button>
                {theme.palette.mode === "dark" && (
                  <Typography variant="caption">
                    <b>Please note:</b>
                    <br />
                    The rendering respects dark mode. If you want a white
                    background, please switch to light mode.
                  </Typography>
                )}
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
              confirm().then(clearCache);
            }}
          >
            Clear cache
          </Button>
        </Tooltip>
      </>
    );
  } else if (selectionType === "edge") {
    fields = <>{deleteButton}</>;
  } else if (selectionType === "multiple") {
    fields = (
      <Stack spacing={3}>
        <Typography variant="h6">Multiple elements selected</Typography>
        <Typography variant="body1">
          Please select only one if you want to edit their values. You can still
          move multiple elements together in the canvas or delete them.
        </Typography>
        {deleteButton}
      </Stack>
    );
  }

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
        {fields}
      </Stack>
    </>
  );
};

export default Inspector;
