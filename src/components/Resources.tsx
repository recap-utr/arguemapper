import {
  faBan,
  faPlusCircle,
  faSave,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Button, Stack, Tab, TextField, Typography } from "@mui/material";
import produce from "immer";
import React, { useCallback, useState } from "react";
import { useViewport } from "react-flow-renderer";
// @ts-ignore
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import * as model from "../model";
import { useGraph } from "./GraphContext";

interface Selection {
  anchor: number;
  focus: number;
}

interface Props {}

const Resources: React.FC<Props> = ({}) => {
  const { graph, setGraph, saveState } = useGraph();
  const { x, y } = useViewport();

  const resources = graph.resources;
  // const setResources = (resources: { [x: string]: model.Resource }) =>
  //   setGraph(produce((draft) => (draft.resources = resources)));
  const [activeTab, setActiveTab] = useState("1");

  const references = Object.fromEntries(
    graph.nodes
      .filter((node) => model.isAtom(node) && node.data.reference)
      .map((node) => [
        node.id,
        (node.data as model.AtomData).reference as model.Reference,
      ])
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(newValue);
    },
    []
  );

  const addAtom = useCallback(
    (resourceId: string, text: string, offset: number) => {
      //   if (cy) {
      //     const newElem = cytoModel.node.initAtom({ text });
      //     newElem.reference = cytoModel.reference.init({
      //       text,
      //       resource: resourceId,
      //       offset,
      //     });
      //     const size = containerSize();
      //     // @ts-ignore
      //     cy.add({
      //       // @ts-ignore
      //       nodes: [
      //         {
      //           data: newElem,
      //           renderedPosition: {
      //             x: size.width / 2,
      //             y: size.height / 2,
      //           },
      //         },
      //       ],
      //     });
      //     saveState();
      //     cy.$id(newElem.id).select();
      //   }
    },
    [saveState]
  );

  const deleteResource = useCallback(
    (key: string) => {
      setGraph(
        produce((draft) => {
          delete draft.resources[key];
        })
      );
      saveState();
    },
    [saveState, setGraph]
  );

  const addResource = useCallback(() => {
    setGraph(
      produce((draft) => {
        draft.resources[model.uuid()] = model.initResource({ text: "" });
      })
    );
    saveState();
  }, [saveState, setGraph]);

  const lastResourceIndex = (Object.keys(resources).length + 1).toString();

  return (
    <TabContext value={activeTab}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <TabList
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={true}
        >
          {Object.keys(resources).map((key, index) => (
            <Tab
              key={index + 1}
              label={(index + 1).toString()}
              value={(index + 1).toString()}
              sx={{ minWidth: 50 }}
            />
          ))}
          <Tab
            label={lastResourceIndex}
            value={lastResourceIndex}
            sx={{ minWidth: 50 }}
          />
        </TabList>
      </Box>
      {Object.entries(resources).map(([key, resource], index) => (
        <TabPanel key={index + 1} value={(index + 1).toString()}>
          <Resource
            id={key}
            resource={resource}
            index={index + 1}
            deleteResource={deleteResource}
            setGraph={setGraph}
            addAtom={addAtom}
            references={references}
          />
        </TabPanel>
      ))}
      <TabPanel value={lastResourceIndex}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
          onClick={addResource}
        >
          Add Resource
        </Button>
      </TabPanel>
    </TabContext>
  );
};

function Resource({
  id,
  resource,
  index,
  deleteResource,
  setGraph,
  addAtom,
  references,
}: {
  id: string;
  resource: model.Resource;
  index: number;
  deleteResource: (key: string) => void;
  setGraph: React.Dispatch<React.SetStateAction<model.Graph>>;
  addAtom: (id: string, text: string, offset: number) => void;
  references: { [k: string]: model.Reference };
}) {
  const [userSelection, setUserSelection] = useState<Selection>({
    anchor: 0,
    focus: 0,
  });
  const [systemSelection, setSystemSelection] = useState<Selection | null>(
    null
  );
  const [hasChanged, setHasChanged] = useState(false);
  // const [textHasFocus, setTextHasFocus] = useState(false);
  // const [hoverAddButton, setHoverAddButton] = useState(false);

  const highlight = useCallback(
    (text: string, callback: (start: number, end: number) => void) => {
      const filteredReferences = Object.values(references).filter(
        (reference) => reference.resource === id
      );

      for (const reference of filteredReferences) {
        const start = reference.offset;

        if (start !== undefined) {
          const end = start + reference.text.length;

          if (end && text.substring(start, end) === reference.text) {
            callback(start, end);
          }
        }
      }
    },
    [id, references]
  );

  // const produceHandleChange = useCallback(
  //   (attr: string | string[]) => {
  //     // We need to return a function here, thus the nested callbacks
  //     return (
  //       event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  //     ) => {
  //       // Prevent the user switching to another tab.
  //       // Otherwise, the local changes would be lost.
  //       setHasChanged(true);
  //       setResources(
  //         produce((draft) => {
  //           _.set(draft, attr, event.target.value);
  //         })
  //       );
  //     };
  //   },
  //   [setResources]
  // );

  // const handleTextChange = useCallback(
  //   (value: string, selection: Selection) => {
  //     if (value === resource.text) {
  //       const start = Math.min(selection.anchor, selection.focus);
  //       const end = Math.max(selection.anchor, selection.focus);
  //       setUserSelection({ anchor: start, focus: end });
  //       setSystemSelection(null);
  //     } else {
  //       setHasChanged(true);
  //       setResources(
  //         produce((draft) => {
  //           draft[id].text = value;
  //         })
  //       );
  //     }
  //   },
  //   [setResources, id, resource.text]
  // );

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField
        hiddenLabel
        fullWidth
        multiline
        minRows={5}
        value={resource.text}
        // onChange={handleTextChange as any}
        InputProps={{
          inputComponent: HighlightWithinTextarea as any,
          inputProps: {
            selection: systemSelection,
            highlight: highlight,
            // onFocus: () => {
            //   setTextHasFocus(true);
            // },
            // onBlur: () => {
            //   setTextHasFocus(false);
            // },
          },
        }}
      />
      <Button
        fullWidth
        variant="contained"
        color="error"
        startIcon={<FontAwesomeIcon icon={faTrash} />}
        onClick={() => {
          deleteResource(id);
        }}
      >
        Delete Resource
      </Button>
      {hasChanged && (
        <Stack justifyContent="space-around" direction="row" sx={{ width: 1 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<FontAwesomeIcon icon={faBan} />}
            onClick={() => {
              // resetResources();
              // setHasChanged(false);
              // setAllowTabChange(true);
            }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faSave} />}
            onClick={() => {
              // writeResources();
              // setHasChanged(false);
              // setAllowTabChange(true);
            }}
          >
            Save
          </Button>
        </Stack>
      )}
      {!hasChanged && (
        // userSelection.anchor !== userSelection.focus &&
        // (textHasFocus || hoverAddButton) && (
        <Button
          fullWidth
          variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
          onClick={() => {
            addAtom(
              id,
              resource.text.substring(
                userSelection.anchor,
                userSelection.focus
              ),
              userSelection.anchor
            );
            // setHoverAddButton(false);
            // setUserSelection({
            //   anchor: 0,
            //   focus: 0,
            // });
          }}
          // onMouseDown={() => {
          //   setHoverAddButton(true);
          // }}
        >
          Add selected text
        </Button>
      )}
    </Stack>
  );
}

export default Resources;
