import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  type ChangeEvent,
  forwardRef,
  type UIEvent,
  useCallback,
  useMemo,
  useRef,
} from "react";

export type HighlightRange = readonly [start: number, end: number];

export interface HighlightTextareaProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Sorted, non-overlapping character ranges to highlight. */
  ranges: readonly HighlightRange[];
  /** Reports the current text selection as character offsets. */
  onSelectionChange?: (start: number, end: number) => void;
  className?: string;
}

interface Segment {
  text: string;
  highlight: boolean;
}

function buildSegments(text: string, ranges: readonly HighlightRange[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const [rawStart, rawEnd] of ranges) {
    const start = Math.max(cursor, Math.min(rawStart, text.length));
    const end = Math.max(start, Math.min(rawEnd, text.length));

    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlight: false });
    if (end > start) segments.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlight: false });
  return segments;
}

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
export const HighlightTextarea = forwardRef<HTMLTextAreaElement, HighlightTextareaProps>(
  function HighlightTextarea({ value, onChange, ranges, onSelectionChange, className, ...rest }, ref) {
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

    const reportSelection = useCallback(() => {
      const node = textareaRef.current;
      if (node) onSelectionChange?.(node.selectionStart, node.selectionEnd);
    }, [onSelectionChange]);

    return (
      <Box className={className} sx={{ position: "relative", width: "100%" }}>
        <Box
          ref={backdropRef}
          aria-hidden
          sx={{ ...sharedSx, position: "absolute", inset: 0, overflow: "hidden", color: "transparent", pointerEvents: "none" }}
        >
          {segments.map((segment, index) =>
            segment.highlight ? (
              <Box
                // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
                key={index}
                component="mark"
                sx={{ color: "transparent", borderRadius: "2px", backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.4) }}
              >
                {segment.text}
              </Box>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
              <span key={index}>{segment.text}</span>
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
          onSelect={reportSelection}
          sx={{ ...sharedSx, position: "relative", display: "block", width: "100%", boxSizing: "border-box", resize: "none", outline: "none", color: "text.primary", backgroundColor: "transparent", overflow: "auto" }}
          {...rest}
        />
      </Box>
    );
  },
);
