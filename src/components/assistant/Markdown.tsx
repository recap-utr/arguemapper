import { Box, Link } from "@mui/material";
import MarkdownToJsx from "markdown-to-jsx";
import { memo } from "react";

const overrides = {
  a: { component: Link, props: { target: "_blank", rel: "noopener noreferrer" } },
};

/**
 * Render assistant text as markdown (markdown-to-jsx, zero deps), themed for the MUI panel and safe
 * against raw HTML in model output. `forceWrapper` yields a single `<div>` we lay out as a flex
 * column, which spaces the blocks evenly and avoids per-element margin tuning.
 *
 * Memoized on `children`: during streaming only the growing part's text changes, so already-settled
 * message parts skip re-parsing on every token.
 */
export const Markdown = memo(({ children }: { children: string }) => (
  <Box
    sx={{
      typography: "body2",
      "& > div": { display: "flex", flexDirection: "column", gap: 0.5 },
      "& > div > *": { m: 0 },
      "& :is(h1, h2, h3, h4, h5, h6)": { fontSize: "1em", fontWeight: 600 },
      "& code": { px: 0.5, borderRadius: 0.5, bgcolor: "action.hover", fontFamily: "monospace" },
      "& pre": { p: 1, borderRadius: 1, overflowX: "auto", bgcolor: "action.hover" },
    }}
  >
    <MarkdownToJsx
      options={{ forceBlock: true, forceWrapper: true, disableParsingRawHTML: true, overrides }}
    >
      {children}
    </MarkdownToJsx>
  </Box>
));
