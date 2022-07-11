import {
  faBan,
  faCaretDown,
  faCommentDots,
  faDownload,
  faFileArrowUp,
  faFileCirclePlus,
  faFileCode,
  faFileImage,
  faFilePen,
  faSave,
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
  SelectChangeEvent,
  Stack,
  styled,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import produce from "immer";
import _, { startCase } from "lodash";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback, useEffect, useState } from "react";
import * as cytoModel from "../model/cytoWrapper";
import { isAtom, isScheme } from "../model/node";
import * as convert from "../services/convert";
import { cyto2aif, cyto2protobuf, proto2json } from "../services/convert";
import * as date from "../services/date";
import demoGraph from "../services/demo";
import { useGraph } from "./GraphContext";

const NULL_VALUE = "###NULL###";

function generateFilename() {
  return date.format(date.now(), "yyyy-MM-dd-HH-mm-ss");
}

// https://stackoverflow.com/a/55613750/7626878
async function downloadJson(data: any) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, ".json");
}

async function downloadBlob(data: Blob, suffix: string) {
  const href = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = href;
  link.download = generateFilename() + suffix;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const Input = styled("input")({
  display: "none",
});

type ElementType = "graph" | "atom" | "scheme" | "edge" | "null";

interface Props {
  openSidebar: (value: boolean) => void;
}

const Inspector: React.FC<Props> = ({ openSidebar }) => {
  const { cy, updateGraph, exportState, resetGraph, clearCache } = useGraph();
  const [element, setElement] = useState(cy?.data());
  const [modifiedAttributes, setModifiedAttributes] = useState<
    Array<string | string[]>
  >([]);
  const confirm = useConfirm();
  const theme = useTheme();

  const elementType: () => ElementType = useCallback(() => {
    if (element && isScheme(element)) {
      return "scheme";
    } else if (element && isAtom(element)) {
      return "atom";
    } else if (element && element.source && element.target) {
      return "edge";
    } else if (element) {
      return "graph";
    } else {
      return "null";
    }
  }, [element]);

  useEffect(() => {
    if (cy) {
      setElement(cy.data());

      cy.on("select", (e) => {
        openSidebar(true);
        setModifiedAttributes([]);

        if (cy.$(":selected").length === 1) {
          setElement(e.target.data());
        } else {
          setElement(null);
        }
      });

      cy.on("unselect", () => {
        if (cy.$(":selected").length === 0) {
          openSidebar(false);
          setModifiedAttributes([]);
          setElement(cy.data());
        }
      });
      cy.on("remove", () => {
        openSidebar(false);
        cy.elements().selectify();
        cy.elements().unselect();
        setModifiedAttributes([]);
        setElement(cy.data());
      });
    }
  }, [cy, openSidebar]);

  const produceHandleChange = useCallback(
    (attr: string | string[]) => {
      // We need to return a function here, thus the nested callbacks
      return (
        event:
          | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          | React.ChangeEvent<{
              name?: string;
              value: any;
              event: Event | React.SyntheticEvent<Element, Event>;
            }>
          | SelectChangeEvent<HTMLInputElement | string>
      ) => {
        setModifiedAttributes((previous) => [...previous, attr]);

        if (cy) {
          // Prevent the user from selecting another element.
          // Otherwise, the local changes would be lost.
          cy.elements().unselectify();

          // Update our interim element
          setElement(
            produce((draft: any) => {
              _.set(draft, attr, event.target.value);

              if (
                Array.isArray(attr) &&
                attr[0] === "scheme" &&
                attr[1] === "type"
              ) {
                draft.scheme.value = // "Default";
                  cytoModel.node.schemeMap[
                    event.target.value as cytoModel.node.SchemeType
                  ]?.DEFAULT ?? NULL_VALUE;
              }
            })
          );
        }
      };
    },
    [cy]
  );

  let fields = null;

  const deleteButton = (
    <Button
      color="error"
      startIcon={<FontAwesomeIcon icon={faTrash} />}
      variant="contained"
      onClick={() => {
        cy?.$(":selected").remove();
        updateGraph();
      }}
    >
      Delete selection
    </Button>
  );

  const participantFields: {
    [x in keyof cytoModel.participant.Participant]?: string;
  } = { name: "Name", email: "Email", username: "Username" };

  if (elementType() === "scheme") {
    fields = (
      <>
        <FormControl fullWidth>
          <InputLabel>Scheme Type</InputLabel>
          <Select
            value={element.scheme?.type}
            label="Scheme Type"
            onChange={produceHandleChange(["scheme", "type"])}
            defaultValue={NULL_VALUE}
          >
            <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
            {Object.entries(cytoModel.node.SchemeType).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {startCase(value)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {element.scheme?.type && element.scheme?.type !== NULL_VALUE && (
          <FormControl fullWidth>
            <InputLabel>Argumentation Scheme</InputLabel>
            <Select
              value={element.scheme?.value}
              label="Argumentation Scheme"
              onChange={produceHandleChange(["scheme", "value"])}
              defaultValue={NULL_VALUE}
            >
              {/* <MenuItem value={NULL_VALUE}>Unknown</MenuItem> */}
              {Object.entries(
                cytoModel.node.schemeMap[
                  element.scheme.type as cytoModel.node.SchemeType
                ]
              ).map(([key, value]) => {
                return (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}
        {deleteButton}
      </>
    );
  } else if (elementType() === "atom") {
    fields = (
      <>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Text"
          value={element.text}
          onChange={produceHandleChange("text")}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Original Text"
          value={element.reference?.text}
          onChange={produceHandleChange(["reference", "text"])}
        />
        <Button
          startIcon={<FontAwesomeIcon icon={faCommentDots} />}
          variant="contained"
          onClick={() => {
            const nodeId = cy?.$(":selected").id();

            if (cy && nodeId) {
              cy.data("majorClaim", nodeId);
              updateGraph();
            }
          }}
        >
          Set as Major Claim
        </Button>
        {deleteButton}
      </>
    );
  } else if (elementType() === "graph") {
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
                            confirm().then(() =>
                              resetGraph(convert.importGraph(parsedGraph))
                            );
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
                    confirm().then(() => resetGraph(cytoModel.init({})));
                  }}
                >
                  Load Empty
                </Button>
                <Button
                  startIcon={<FontAwesomeIcon icon={faFilePen} />}
                  variant="contained"
                  onClick={() => {
                    confirm().then(() => resetGraph(demoGraph()));
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
                    downloadJson(proto2json(cyto2protobuf(exportState())));
                  }}
                >
                  Arguebuf
                </Button>
                <Button
                  startIcon={<FontAwesomeIcon icon={faFileCode} />}
                  variant="contained"
                  onClick={() => {
                    downloadJson(cyto2aif(exportState()));
                  }}
                >
                  AIF
                </Button>
                <Button
                  startIcon={<FontAwesomeIcon icon={faFileImage} />}
                  variant="contained"
                  onClick={() => {
                    if (cy) {
                      downloadBlob(
                        cy.png({ output: "blob", scale: 2, full: true }),
                        ".png"
                      );
                    }
                  }}
                >
                  PNG
                </Button>
                <Button
                  startIcon={<FontAwesomeIcon icon={faFileImage} />}
                  variant="contained"
                  onClick={() => {
                    if (cy) {
                      downloadBlob(
                        cy.jpg({
                          output: "blob",
                          scale: 2,
                          full: true,
                          quality: 1,
                          bg: theme.palette.background.default,
                        }),
                        ".jpg"
                      );
                    }
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
                {Object.entries((element as Graph).participants).map(
                  ([id, participant]) => (
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
                                  participant[
                                    attr as keyof cytoModel.participant.Participant
                                  ]
                                }
                                onChange={produceHandleChange([
                                  "participants",
                                  id,
                                  attr,
                                ])}
                              />
                            )
                          )}
                          <Button
                            startIcon={<FontAwesomeIcon icon={faMinusCircle} />}
                            color="error"
                            variant="contained"
                            onClick={() => {
                              setElement(
                                produce((draft: any) => {
                                  delete draft.participants[id];
                                })
                              );
                            }}
                          >
                            Remove Participant
                          </Button>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )
                )}
                <Button
                  startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
                  variant="contained"
                  onClick={() => {
                    setElement(
                      produce((draft: any) => {
                        draft.participants[uuid()] = cytoModel.participant.init(
                          {
                            name: "Unknown",
                          }
                        );
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
  } else if (elementType() === "edge") {
    fields = <>{deleteButton}</>;
  } else if (elementType() === "null") {
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
          {elementType() !== "graph" && (
            <Tooltip describeChild title="Close inspector for current element">
              <IconButton
                onClick={() => {
                  openSidebar(false);
                  cy?.elements().selectify();
                  cy?.elements().unselect();
                  setModifiedAttributes([]);
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
        {modifiedAttributes.length > 0 && (
          <Stack justifyContent="space-around" direction="row" width={1}>
            <Button
              variant="contained"
              color="error"
              startIcon={<FontAwesomeIcon icon={faBan} />}
              onClick={() => {
                openSidebar(false);
                cy?.elements().selectify();
                cy?.elements().unselect();
                setModifiedAttributes([]);
              }}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              startIcon={<FontAwesomeIcon icon={faSave} />}
              onClick={() => {
                if (element) {
                  const modifiedAttrs = new Set(modifiedAttributes);
                  // Could improve performance when avoiding deep clone
                  const elem = _.cloneDeep(element);

                  // TODO: This hack does not work with scheme type!
                  modifiedAttrs.forEach((attr) => {
                    if (_.get(elem, attr) === NULL_VALUE) {
                      _.set(elem, attr, undefined);
                    }
                  });

                  const cytoElem = cy?.$id(elem.id);
                  cytoElem?.data(elem);
                  updateGraph();
                }
                cy?.elements().selectify();
                setModifiedAttributes([]);
              }}
            >
              Save
            </Button>
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default Inspector;
