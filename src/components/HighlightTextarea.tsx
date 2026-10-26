import { Box } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import {
  type ChangeEvent,
  type ComponentProps,
  type UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

export type HighlightRange = readonly [start: number, end: number];

export interface HighlightTextareaProps extends Omit<
  ComponentProps<"textarea">,
  "onChange" | "value"
> {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Sorted, non-overlapping character ranges to highlight. */
  ranges: readonly HighlightRange[];
  /** Reports the current text selection as character offsets. */
  onSelectionChange?: (start: number, end: number) => void;
  /** Scrolls this range into view whenever it changes (e.g. its node is selected). */
  revealRange?: HighlightRange;
  /** Injected by MUI when used as an input slot; must not reach the DOM. */
  ownerState?: unknown;
}

interface Segment {
  offset: number;
  text: string;
  highlight: boolean;
}

function buildSegments(text: string, ranges: readonly HighlightRange[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const [rawStart, rawEnd] of ranges) {
    const start = Math.max(cursor, Math.min(rawStart, text.length));
    const end = Math.max(start, Math.min(rawEnd, text.length));

    if (start > cursor)
      segments.push({ offset: cursor, text: text.slice(cursor, start), highlight: false });
    if (end > start)
      segments.push({ offset: start, text: text.slice(start, end), highlight: true });
    cursor = end;
  }

  if (cursor < text.length)
    segments.push({ offset: cursor, text: text.slice(cursor), highlight: false });
  return segments;
}

// Styled once at module scope so emotion does not re-serialize per highlight.
const Highlight = styled("mark")(({ theme }) => ({
  color: "transparent",
  borderRadius: "2px",
  backgroundColor: alpha(theme.palette.warning.main, 0.4),
}));

// Shared typography so the backdrop and textarea wrap identically.
const sharedSx = {
  margin: 0,
  border: 0,
  padding: 0,
  font: "inherit",
  lineHeight: "inherit",
  letterSpacing: "inherit",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "break-word",
} as const;

/**
 * A textarea that renders highlight ranges behind the editable text using the
 * classic backdrop-overlay technique (no rich-text dependency). Designed to be
 * used as the `htmlInput` slot of a MUI `TextField`.
 */
export function HighlightTextarea({
  value,
  onChange,
  ranges,
  onSelectionChange,
  revealRange,
  className,
  ownerState: _ownerState,
  ref,
  ...rest
}: HighlightTextareaProps): React.JSX.Element {
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const segments = useMemo(() => buildSegments(value, ranges), [value, ranges]);

  const syncScroll = useCallback((event: UIEvent<HTMLTextAreaElement>) => {
    if (!backdropRef.current) return;
    backdropRef.current.scrollTop = event.currentTarget.scrollTop;
    backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }, []);

  // Reports selection only while this textarea is focused, so changes in
  // other inputs never feed it stale offsets.
  const reportSelection = useCallback(() => {
    const node = textareaRef.current;
    if (node && document.activeElement === node)
      onSelectionChange?.(node.selectionStart, node.selectionEnd);
  }, [onSelectionChange]);

  // `selectionchange` fires for every selection update — including caret
  // moves and collapses that the element-level `select` event drops, which
  // is what made the reported selection (and the consuming button) flaky.
  useEffect(() => {
    document.addEventListener("selectionchange", reportSelection);
    return () => document.removeEventListener("selectionchange", reportSelection);
  }, [reportSelection]);

  // Scroll the revealed range (the first backdrop mark) into view.
  const revealStart = revealRange?.[0];
  const revealEnd = revealRange?.[1];
  useEffect(() => {
    const textarea = textareaRef.current;
    const backdrop = backdropRef.current;
    if (revealStart === undefined || revealEnd === undefined || !textarea || !backdrop) return;
    const mark = backdrop.querySelector<HTMLElement>("mark");
    if (!mark) return;
    textarea.scrollTop = Math.max(
      0,
      mark.offsetTop - (textarea.clientHeight - mark.offsetHeight) / 2,
    );
    backdrop.scrollTop = textarea.scrollTop;
  }, [revealStart, revealEnd]);

  return (
    <Box className={className} sx={{ position: "relative", width: "100%" }}>
      <Box
        ref={backdropRef}
        aria-hidden
        sx={{
          ...sharedSx,
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          color: "transparent",
          pointerEvents: "none",
        }}
      >
        {segments.map((segment) =>
          segment.highlight ? (
            <Highlight key={segment.offset}>{segment.text}</Highlight>
          ) : (
            <span key={segment.offset}>{segment.text}</span>
          ),
        )}
        {/* Keep the backdrop tall enough when the text ends with a newline. */}
        {value.endsWith("\n") ? " " : ""}
      </Box>
      <Box
        component="textarea"
        ref={setTextareaRef}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        onFocus={reportSelection}
        sx={{
          ...sharedSx,
          position: "relative",
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          resize: "none",
          outline: "none",
          color: "text.primary",
          backgroundColor: "transparent",
          overflow: "auto",
        }}
        {...rest}
      />
    </Box>
  );
}
