import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import {
  Alert,
  Box,
  Button,
  Paper,
  Popper,
  Stack,
  Tab,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useReactFlow } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useGuideStep } from "@/components/canvas/Guide.js";
import { TabBar } from "@/components/TabBar.js";
import { TooltipIconButton } from "@/components/TooltipIconButton.js";
import * as model from "@/model.js";
import { generateDemo } from "@/services/demo.js";
import { useArgueActions, useArgueConfig, useDeepEqual, useDocument } from "@/store.js";

/** Passage of a text that the atom with the id quotes. */
interface Annotation {
  id: string;
  start: number;
  end: number;
}

/** Text panel: read the texts, annotate passages as claims, and edit them. */
export const TextPane: React.FC = () => {
  const resources = useDocument((state) => state.graph.resources);
  const shown = useDocument((state) => model.shownResource(state.graph, state.selectedResource));
  // graph edits keep unchanged elements, so references are compared by identity
  const selectedReference = useDocument((state) => model.selectedAtom(state)?.reference);
  const { readOnly } = useArgueConfig();
  const { editGraph, setState } = useArgueActions();
  const [editing, setEditing] = useState(false);
  const ids = Object.keys(resources);

  // Reveal the text a selected claim quotes.
  useEffect(() => {
    const resource = selectedReference?.resource;
    if (resource !== undefined) setState({ selectedResource: resource });
  }, [selectedReference, setState]);

  // empty texts can only be edited
  const empty = shown !== undefined && resources[shown].text === "";

  const addText = (text = "") => {
    const resource = new arguebuf.Resource({ text });
    editGraph((graph) => {
      graph.addResource(resource);

      return { selectedResource: resource.id };
    });
  };

  return (
    <Stack sx={{ flex: "1 1 0", minHeight: 0 }}>
      {shown !== undefined && (
        <TabBar
          label="Texts"
          value={shown}
          onChange={(value) => setState({ selectedResource: value })}
          actions={
            !readOnly && (
              <>
                <TooltipIconButton title="Add another text" icon={AddIcon} onClick={() => addText()} />
                {!empty && (
                  <TooltipIconButton
                    title={editing ? "Done editing" : "Edit text"}
                    icon={editing ? CheckIcon : EditIcon}
                    color={editing ? "primary" : "default"}
                    onClick={() => setEditing((current) => !current)}
                  />
                )}
              </>
            )
          }
        >
          {ids.map((id, index) => (
            <Tab key={id} value={id} label={resources[id].title || `Text ${index + 1}`} />
          ))}
        </TabBar>
      )}
      <Box sx={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", p: 2 }}>
        {shown === undefined ? (
          readOnly ? (
            <Typography color="text.secondary">This graph has no text.</Typography>
          ) : (
            <TextStart onStart={addText} />
          )
        ) : editing || empty ? (
          <ResourceEditor key={shown} id={shown} onDone={() => setEditing(false)} />
        ) : (
          <ResourceView key={shown} id={shown} />
        )}
      </Box>
    </Stack>
  );
};

/** The first text of a graph, pasted to start annotating it. */
const TextStart: React.FC<{ onStart: (text: string) => void }> = ({ onStart }) => {
  const [text, setText] = useState("");
  const { openGraph } = useArgueActions();

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Add the text you want to analyze</Typography>
      <Typography variant="body2" color="text.secondary">
        For example a newspaper article or a comment. You can still edit it later.
      </Typography>
      <TextField
        label="Text"
        placeholder="Paste your text here"
        fullWidth
        multiline
        minRows={8}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Button variant="contained" disabled={text.trim() === ""} onClick={() => onStart(text)}>
          Start annotating
        </Button>
        <Button
          startIcon={<LightbulbIcon />}
          onClick={() => openGraph(generateDemo())}
        >
          See an example
        </Button>
      </Stack>
    </Stack>
  );
};

const ResourceEditor: React.FC<{ id: string; onDone: () => void }> = ({ id, onDone }) => {
  const resource = useDocument((state) => state.graph.resources[id]);
  const { editGraph } = useArgueActions();

  const update =
    (field: "title" | "text" | "source") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      editGraph((graph) => {
        // re-anchors the references if the text changes
        graph.updateResource(id, { [field]: value });
      });
    };

  return (
    <Stack spacing={2}>
      <TextField label="Title" fullWidth value={resource.title ?? ""} onChange={update("title")} />
      <TextField
        label="Text"
        placeholder="Paste the text you want to analyze"
        fullWidth
        multiline
        minRows={8}
        value={resource.text}
        onChange={update("text")}
      />
      <TextField
        label="Source"
        helperText="Where the text comes from, e.g. a web address"
        fullWidth
        value={resource.source ?? ""}
        onChange={update("source")}
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
        <Button
          variant="contained"
          disabled={resource.text.trim() === ""}
          startIcon={<CheckIcon />}
          onClick={onDone}
        >
          Done
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => {
            editGraph((graph) => {
              graph.removeResource(id);
            });
            onDone();
          }}
        >
          Delete text
        </Button>
      </Stack>
    </Stack>
  );
};

/** Passage of the text, covered by the atoms whose references contain it, the shortest first. */
interface Segment {
  start: number;
  end: number;
  atoms: string[];
}

function segments(text: string, annotations: readonly Annotation[]): Segment[] {
  const bounds = [
    ...new Set([0, text.length, ...annotations.flatMap(({ start, end }) => [start, end])]),
  ].toSorted((a, b) => a - b);

  return bounds.slice(0, -1).map((start, index) => {
    const end = bounds[index + 1];
    const atoms = annotations
      .filter((annotation) => annotation.start <= start && annotation.end >= end)
      .toSorted((a, b) => a.end - a.start - (b.end - b.start))
      .map(({ id }) => id);

    return { start, end, atoms };
  });
}

const Mark = styled("mark", { shouldForwardProp: (prop) => prop !== "selected" })<{
  selected: boolean;
}>(({ theme, selected }) => ({
  color: "inherit",
  cursor: "pointer",
  borderRadius: 2,
  backgroundColor: theme.alpha(
    selected ? theme.palette.primary.main : theme.palette.warning.main,
    selected ? 0.4 : 0.25,
  ),
}));

/** Passage selected by the user. */
interface Span {
  start: number;
  end: number;
  range: Range;
}

/** The trimmed passage of the selection inside the container, if any. */
function selectedSpan(container: HTMLElement): Span | undefined {
  const selection = document.getSelection();

  if (selection === null || selection.isCollapsed || selection.rangeCount === 0) {
    return undefined;
  }

  const range = selection.getRangeAt(0);

  if (!container.contains(range.commonAncestorContainer)) {
    return undefined;
  }

  // the container renders the text verbatim, so the length of the text before is the offset
  const before = document.createRange();
  before.selectNodeContents(container);
  before.setEnd(range.startContainer, range.startOffset);
  const offset = before.toString().length;
  const text = range.toString();
  const start = offset + text.length - text.trimStart().length;
  const end = offset + text.trimEnd().length;

  return end > start ? { start, end, range: range.cloneRange() } : undefined;
}

/** The text with its annotated passages, which select their claims. */
const ResourceView: React.FC<{ id: string }> = ({ id }) => {
  const resource = useDocument((state) => state.graph.resources[id]);
  // the resource may be removed before this view, and moving nodes keeps the passages
  const annotations = useDocument(
    useDeepEqual(({ graph }) =>
      Object.hasOwn(graph.resources, id)
        ? graph.annotations(id).map(({ node, start, end }) => ({ id: node.id, start, end }))
        : [],
    ),
  );
  const selected = useDocument((state) => state.selection.nodes);
  const selectedId = useDocument((state) => model.selectedAtom(state)?.id);
  const guideStep = useGuideStep();
  const { readOnly } = useArgueConfig();
  const { setState } = useArgueActions();
  const flow = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState<Span>();

  const parts = segments(resource.text, annotations);

  // Scroll to the passage of a selected claim.
  useEffect(() => {
    if (selectedId !== undefined) {
      containerRef.current
        ?.querySelector(`mark[data-atoms~="${CSS.escape(selectedId)}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedId]);

  // The passage stays until the user taps elsewhere, as tapping the popup collapses the selection.
  useEffect(() => {
    const onSelectionChange = () => {
      const container = containerRef.current;
      const next = container ? selectedSpan(container) : undefined;
      if (next !== undefined) setSpan(next);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node && popperRef.current?.contains(event.target))) {
        setSpan(undefined);
      }
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const reveal = (atom: string) => {
    // dragging across a passage selects text instead
    if (!document.getSelection()?.isCollapsed) return;

    setState({ selection: model.nodeSelection(atom) });
    void flow.fitView({ nodes: [{ id: atom }], duration: 300, maxZoom: flow.getZoom() });
  };

  return (
    <>
      {/* the guide gives the same hint at this step */}
      {!readOnly && guideStep !== "claims" && parts.every(({ atoms }) => atoms.length === 0) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a passage and choose “Add claim” to turn it into a claim.
        </Alert>
      )}
      {resource.source && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
          Source: {resource.source}
        </Typography>
      )}
      <Typography
        ref={containerRef}
        component="div"
        sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.8 }}
      >
        {parts.map(({ start, end, atoms }) =>
          atoms.length === 0 ? (
            <Fragment key={start}>{resource.text.slice(start, end)}</Fragment>
          ) : (
            <Mark
              key={start}
              data-atoms={atoms.join(" ")}
              selected={atoms.some((atom) => selected.includes(atom))}
              onClick={() => reveal(atoms[0])}
            >
              {resource.text.slice(start, end)}
            </Mark>
          ),
        )}
      </Typography>
      {!readOnly && (
        <Popper
          ref={popperRef}
          open={span !== undefined}
          anchorEl={span && { getBoundingClientRect: () => span.range.getBoundingClientRect() }}
          // below the selection, where the menus of mobile browsers do not cover it
          placement="bottom"
          sx={{ zIndex: "modal" }}
        >
          {span && (
            <PassageActions
              resource={id}
              span={span}
              onDone={() => {
                document.getSelection()?.removeAllRanges();
                setSpan(undefined);
              }}
            />
          )}
        </Popper>
      )}
    </>
  );
};

interface ActionsProps {
  resource: string;
  span: Span;
  onDone: () => void;
}

/** Turn the selected passage into a claim, related to the selected claim if there is one. */
const PassageActions: React.FC<ActionsProps> = ({ resource, span, onDone }) => {
  const text = useDocument((state) =>
    state.graph.resources[resource].text.slice(span.start, span.end),
  );
  const target = useDocument(model.selectedAtom);
  const { editGraph, addNode } = useArgueActions();
  const reference = new arguebuf.Reference({ text, resource, offset: span.start });
  const atom = model.newAtom().with({ text, reference });

  const addRelated = (target: model.AtomNode, type: arguebuf.SchemeType) => {
    const { x, y } = model.position(target);
    // premises are placed below their conclusion
    addNode(atom, {
      position: { x, y: y + 200 },
      link: { node: target.id, scheme: arguebuf.defaultScheme(type) },
    });
    onDone();
  };

  return (
    <Paper elevation={8} sx={{ mt: 1, p: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => {
          addNode(atom);
          onDone();
        }}
      >
        Add claim
      </Button>
      {target && (
        <>
          <Tooltip title="Add a claim that supports the selected claim">
            <Button
              size="small"
              sx={{ color: arguebuf.schemeColors.support.bg }}
              onClick={() => addRelated(target, "support")}
            >
              Supports
            </Button>
          </Tooltip>
          <Tooltip title="Add a claim that attacks the selected claim">
            <Button
              size="small"
              sx={{ color: arguebuf.schemeColors.attack.bg }}
              onClick={() => addRelated(target, "attack")}
            >
              Attacks
            </Button>
          </Tooltip>
          <Tooltip title="Link the selected claim to this passage">
            <Button
              size="small"
              onClick={() => {
                editGraph((graph) => {
                  graph.updateAtom(
                    target.id,
                    target.text === "" ? { text, reference } : { reference },
                  );
                });
                onDone();
              }}
            >
              Use as quote
            </Button>
          </Tooltip>
        </>
      )}
    </Paper>
  );
};
