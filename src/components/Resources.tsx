import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Button, Stack, Tab, TextField, Typography } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as model from "@/model.js";
import { type State, useArgueActions, useStore } from "@/store.js";
import { HighlightTextarea, type HighlightRange } from "@/components/HighlightTextarea.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

interface SelectedAtom {
  selected: boolean;
  reference?: arguebuf.Reference;
}

// The selected atom state — the one input both the highlight computation and
// the tab-reveal effect need from global state.
const selectSelectedAtom = (state: State): SelectedAtom => {
  if (state.selection.type !== "atom") return { selected: false };
  return {
    selected: true,
    reference: (state.nodes[state.selection.nodes[0]] as model.AtomNode | undefined)?.data
      .reference,
  };
};

function computeHighlightRanges(
  text: string,
  references: Record<string, arguebuf.Reference>,
  resourceId: string,
  selectedAtom: SelectedAtom,
): HighlightRange[] {
  const matchRange = (reference: arguebuf.Reference): HighlightRange | undefined => {
    const start = reference.offset;
    if (start === undefined) return undefined;
    const end = start + reference.text.length;
    return text.substring(start, end) === reference.text ? [start, end] : undefined;
  };

  // While a single atom is selected, highlight only its own reference.
  // If the selected atom has no reference, no resource text should be highlighted.
  if (selectedAtom.selected) {
    const { reference: selectedReference } = selectedAtom;
    if (selectedReference === undefined) return [];
    if (selectedReference.resource !== resourceId) return [];
    const range = matchRange(selectedReference);
    return range ? [range] : [];
  }

  const ranges = Object.values(references)
    .filter((reference) => reference.resource === resourceId)
    .map(matchRange)
    .filter((range): range is HighlightRange => range !== undefined)
    .sort((a, b) => a[0] - b[0]);

  // Merge overlapping ranges so adjacent highlights render as one.
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

const Resources: React.FC<Props> = ({ onClose }) => {
  const references = useStore(
    (state) =>
      Object.fromEntries(
        state.nodes
          .filter((node) => node.data.type === "atom" && node.data.reference !== undefined)
          .map((node) => [node.id, (node as model.AtomNode).data.reference as arguebuf.Reference]),
      ),
    dequal,
  );
  const resourceIds = useStore((state) => Object.keys(state.graph.resources), dequal);
  const selectedAtom = useStore(selectSelectedAtom, dequal);
  const activeTab = useStore((state) => (state.selectedResourceTab + 1).toString());
  const { setState, setStateWithoutHistory, mutate } = useArgueActions();
  const setActiveTab = useCallback(
    (value: number) => {
      setState({ selectedResourceTab: value - 1 });
    },
    [setState],
  );

  // Reveal the resource a selected atom references so its highlight is visible.
  useEffect(() => {
    const resourceId = selectedAtom.reference?.resource;
    if (resourceId === undefined) return;
    const tabIndex = resourceIds.indexOf(resourceId);
    if (tabIndex >= 0) setStateWithoutHistory({ selectedResourceTab: tabIndex });
  }, [selectedAtom, resourceIds, setStateWithoutHistory]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(Number.parseInt(newValue));
    },
    [setActiveTab],
  );

  const addResource = useCallback(() => {
    mutate((draft) => {
      draft.graph.addResource(
        new arguebuf.Resource({
          text: "",
        }),
      );
    });
  }, [mutate]);

  const lastResourceIndex = (resourceIds.length + 1).toString();

  return (
    <>
      <SectionHeader title="Resources" onClose={onClose} />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <TabContext value={activeTab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleTabChange} variant="scrollable" scrollButtons={true}>
              {resourceIds.map((key, index) => {
                const value = (index + 1).toString();
                return <Tab key={key} label={value} value={value} sx={{ minWidth: 50 }} />;
              })}
              <Tab label={lastResourceIndex} value={lastResourceIndex} sx={{ minWidth: 50 }} />
            </TabList>
          </Box>
          {resourceIds.map((id, index) => {
            const tabIndex = index + 1;
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
      </Box>
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
  const selectedAtom = useStore(selectSelectedAtom, dequal);
  const flow = useReactFlow();
  const { mutate, addNodeWithSelection, canvasCenter } = useArgueActions();

  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });

  const ranges = useMemo(
    () => computeHighlightRanges(resource.text, references, id, selectedAtom),
    [resource.text, references, id, selectedAtom],
  );

  // When an atom is selected `ranges` holds only its own reference, if any.
  const revealRange = selectedAtom.reference ? ranges[0] : undefined;

  const updateField = useCallback(
    (field: "title" | "text" | "source") =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = event.target;
        mutate((draft) => {
          draft.graph.resources[id][field] = value;
        });
      },
    [id, mutate],
  );

  const addAtom = useCallback(() => {
    const text = resource.text.substring(textSelection.start, textSelection.end);
    const offset = textSelection.start;
    const reference = new arguebuf.Reference({ offset, text, resource: id });

    const { x, y } = flow.screenToFlowPosition(canvasCenter());
    addNodeWithSelection(model.initAtom({ data: { text, reference }, position: { x, y } }));
    // Clearing collapses the button back to disabled so the same span can't be
    // added twice by accident; a fresh selection re-enables it.
    setTextSelection({ start: 0, end: 0 });
  }, [resource.text, textSelection, id, flow, addNodeWithSelection, canvasCenter]);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    setTextSelection({ start, end });
  }, []);

  const deleteResource = useCallback(() => {
    mutate((draft) => {
      delete draft.graph.resources[id];
    });
  }, [id, mutate]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField fullWidth label="Title" value={resource.title} onChange={updateField("title")} />
      <TextField
        label="Text"
        fullWidth
        multiline
        rows={5}
        value={resource.text}
        onChange={updateField("text")}
        slots={{ htmlInput: HighlightTextarea }}
        slotProps={{
          htmlInput: {
            ranges,
            revealRange,
            onSelectionChange: handleSelectionChange,
          },
        }}
      />
      <TextField
        fullWidth
        label="Source"
        value={resource.source}
        onChange={updateField("source")}
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
        disabled={textSelection.start === textSelection.end}
        startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        onClick={addAtom}
      >
        Add selected text
      </Button>
    </Stack>
  );
};

export default Resources;
