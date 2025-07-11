import {
  faPlusCircle,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tab,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import "draft-js/dist/Draft.css";
import { produce } from "immer";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import HighlightWithinTextarea, {
  Selection as TextSelection,
} from "react-highlight-within-textarea";
import * as model from "../model.js";
import {
  addNodeWithSelection,
  canvasCenter,
  type State,
  setState,
  useStore,
} from "../store.js";

interface Props {
  close: () => void;
}

const Resources: React.FC<Props> = ({ close }) => {
  const references = useStore(
    (state) =>
      Object.fromEntries(
        state.nodes
          .filter(
            (node) =>
              node.data.type === "atom" && node.data.reference !== undefined,
          )
          .map((node) => [
            node.id,
            (node as model.AtomNode).data.reference as arguebuf.Reference,
          ]),
      ),
    dequal,
  );
  const resourceIds = useStore(
    (state) => Object.keys(state.graph.resources),
    dequal,
  );
  const activeTab = useStore((state) =>
    (state.selectedResourceTab + 1).toString(),
  );
  const setActiveTab = useCallback((value: number) => {
    setState({ selectedResourceTab: value - 1 });
  }, []);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(Number.parseInt(newValue));
    },
    [setActiveTab],
  );

  const addResource = useCallback(() => {
    setState(
      produce((draft: State) => {
        draft.graph.addResource(
          new arguebuf.Resource({
            text: "",
          }),
        );
      }),
    );
  }, []);

  const lastResourceIndex = useMemo(
    () => (resourceIds.length + 1).toString(),
    [resourceIds],
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
          <Typography variant="h5">Resources</Typography>
          <Tooltip describeChild title="Close resources">
            <IconButton onClick={close}>
              <FontAwesomeIcon icon={faXmark} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={true}
          >
            {resourceIds.map((key) => {
              const tabIndex = resourceIds.indexOf(key) + 1;
              return (
                <Tab
                  key={key}
                  label={tabIndex.toString()}
                  value={tabIndex.toString()}
                  sx={{ minWidth: 50 }}
                />
              );
            })}
            <Tab
              label={lastResourceIndex}
              value={lastResourceIndex}
              sx={{ minWidth: 50 }}
            />
          </TabList>
        </Box>
        {resourceIds.map((id) => {
          const tabIndex = resourceIds.indexOf(id) + 1;
          return (
            <TabPanel key={id} value={tabIndex.toString()}>
              <Resource id={id} index={tabIndex} references={references} />
            </TabPanel>
          );
        })}
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
    </>
  );
};

interface ResourceProps {
  id: string;
  index: number;
  references: Record<string, arguebuf.Reference>;
}

const Resource: React.FC<ResourceProps> = ({ id, index, references }) => {
  const resource = useStore((state) => state.graph.resources[id]);
  const selection = useStore((state) => state.selection);
  const flow = useReactFlow();

  const [userSelection, setUserSelection] = useState<TextSelection>(
    new TextSelection(0, 0),
  );

  const [systemSelection, setSystemSelection] = useState<
    TextSelection | undefined
  >(undefined);

  const highlight = useCallback(
    (text: string, callback: (start: number, end: number) => void) => {
      if (selection.type === "atom") {
        const selectedAtom = useStore.getState().nodes[
          selection.nodes[0]
        ] as model.AtomNode;
        const selectedReference = selectedAtom.data.reference;

        if (selectedReference !== undefined) {
          const start = selectedReference.offset;
          const end =
            start !== undefined
              ? start + selectedReference.text.length
              : undefined;

          if (
            start !== undefined &&
            end !== undefined &&
            text.substring(start, end) === selectedReference.text
          ) {
            callback(start, end);
          }

          return;
        }
      }

      const raw = Object.values(references)
        .filter((ref) => ref.resource === id)
        .map((ref) => {
          const start = ref.offset;
          const end = start !== undefined ? start + ref.text.length : undefined;

          if (
            start !== undefined &&
            end !== undefined &&
            text.substring(start, end) === ref.text
          ) {
            return [start, end];
          }

          return undefined;
        })
        .filter((entry): entry is number[] => entry !== undefined)
        .sort((a, b) => a[0] - b[0]);

      const merged = [] as number[][];
      const firstHighlight = raw.shift();

      if (firstHighlight !== undefined) {
        merged.push(firstHighlight);

        for (const [nextStart, nextEnd] of raw) {
          const lastIndex = merged.length - 1;
          const [prevStart, prevEnd] = merged[lastIndex];

          if (nextStart > prevEnd) {
            merged.push([nextStart, nextEnd]);
          } else if (nextEnd > prevEnd) {
            merged[lastIndex] = [prevStart, nextEnd];
          }
        }
      }

      for (const [start, end] of merged) {
        callback(start, end);
      }
    },
    [id, references, selection],
  );

  const onChange = useCallback(
    (value: string, selection?: TextSelection) => {
      setSystemSelection(undefined);

      if (selection !== undefined && value === resource.text) {
        const start = Math.min(selection.anchor, selection.focus);
        const end = Math.max(selection.anchor, selection.focus);
        setUserSelection(new TextSelection(start, end));
      } else {
        setState(
          produce((draft: State) => {
            draft.graph.resources[id].text = value;
          }),
        );
      }
    },
    [id, resource.text],
  );

  const addAtom = useCallback(() => {
    const text = resource.text.substring(
      userSelection.anchor,
      userSelection.focus,
    );
    const offset = userSelection.anchor;

    const { x, y } = flow.screenToFlowPosition(canvasCenter());
    const node = model.initAtom({
      data: {
        text,
        reference: new arguebuf.Reference({ offset, text, resource: id }),
      },
      position: { x, y },
    });

    addNodeWithSelection(node);
  }, [resource.text, userSelection, id, flow]);

  const deleteResource = useCallback(() => {
    setState(
      produce((draft: State) => {
        delete draft.graph.resources[id];
      }),
    );
  }, [id]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField
        fullWidth
        label="Title"
        value={resource.title}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              draft.graph.resources[id].title = event.target.value;
            }),
          );
        }}
      />
      <TextField
        label="Text"
        fullWidth
        multiline
        minRows={5}
        value={resource.text}
        onChange={onChange as never}
        InputProps={{
          inputComponent: HighlightWithinTextarea as never,
          inputProps: {
            placeholder: "",
            selection: systemSelection,
            highlight,
          },
        }}
      />
      <TextField
        fullWidth
        label="Source"
        value={resource.source}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              draft.graph.resources[id].source = event.target.value;
            }),
          );
        }}
      />
      <Button
        fullWidth
        variant="contained"
        color="error"
        startIcon={<FontAwesomeIcon icon={faTrash} />}
        onClick={deleteResource}
      >
        Delete Resource
      </Button>
      <Button
        fullWidth
        variant="contained"
        startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        onClick={addAtom}
      >
        Add selected text
      </Button>
    </Stack>
  );
};

export default Resources;
