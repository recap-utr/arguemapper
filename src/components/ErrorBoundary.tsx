import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import * as arguebuf from "arguebuf";
import React, { type ErrorInfo, type ReactNode } from "react";
import * as convert from "@/services/convert.js";

interface Props extends React.PropsWithChildren {
  /**
   * Render a compact, self-contained fallback for a contained subtree (e.g. the assistant panel) so a
   * render error there does not replace the whole app with the recovery screen. Receives the caught
   * error and a `reset` that clears the error and re-renders the children. When omitted, the default
   * full-page recovery UI with graph-state backup is shown (used at the app root).
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /**
   * Reset the boundary automatically whenever any value in this list changes, so a contained subtree
   * recovers once the inputs that produced the error change (e.g. the chat messages).
   */
  resetKeys?: readonly unknown[];
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  state: string | null;
  aif: string | null;
  arguebuf: string | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      state: null,
      aif: null,
      arguebuf: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // A contained subtree (with its own fallback) recovers in place; the graph-state backup below is
    // only meaningful for a whole-app crash, so record the error and stop here.
    if (this.props.fallback) {
      this.setState({ error, errorInfo });
      return;
    }

    let stateString = null;
    let aif = null;
    let arguebufJson = null;

    // Reading and re-exporting the persisted graph must never throw here, or the recovery screen would
    // itself crash (e.g. on a corrupt persisted state) and leave the user with a blank page.
    try {
      stateString = localStorage.getItem("state");
      if (stateString) {
        const state = JSON.parse(stateString).state;
        const { nodes, edges, graph } = convert.importGraph(state.graph);
        const wrapper = { nodes, edges, graph };
        const analyst = new arguebuf.Analyst(state.analyst);

        try {
          aif = JSON.stringify(convert.exportGraph(wrapper, "aif", analyst));
        } catch {
          /* empty */
        }

        try {
          arguebufJson = JSON.stringify(convert.exportGraph(wrapper, "arguebuf", analyst));
        } catch {
          /* empty */
        }
      }
    } catch {
      /* empty */
    }

    this.setState({
      error,
      errorInfo,
      state: stateString,
      aif,
      arguebuf: arguebufJson,
    });
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.state.error === null) return;
    const { resetKeys } = this.props;
    const previous = prevProps.resetKeys;
    if (
      resetKeys !== undefined &&
      previous !== undefined &&
      (resetKeys.length !== previous.length ||
        resetKeys.some((key, index) => !Object.is(key, previous[index])))
    ) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.error && this.state.errorInfo) {
      const { fallback } = this.props;
      if (fallback) {
        return fallback(this.state.error, this.reset);
      }
      return (
        <Container sx={{ paddingBottom: 10, paddingTop: 5 }}>
          <Stack spacing={5}>
            <Stack spacing={1}>
              <Typography variant="h3">Something went wrong…</Typography>
              <Typography variant="h6">
                {this.state.error ? this.state.error.toString() : "Error"}
              </Typography>
              <Typography variant="body1">{this.state.errorInfo.componentStack}</Typography>
            </Stack>
            {this.state.state && (
              <Stack spacing={1}>
                <Typography variant="h3">Application State</Typography>
                <Typography variant="h6">Please copy this code to backup your work!</Typography>
                <Box sx={{ fontFamily: "Monospace" }}>
                  <TextField
                    onFocus={(event) => event.target.select()}
                    multiline
                    maxRows={5}
                    fullWidth
                    value={this.state.state}
                  />
                </Box>
              </Stack>
            )}
            {this.state.aif && (
              <Stack spacing={1}>
                <Typography variant="h3">AIF Export</Typography>
                <Typography variant="h6">Please copy this code to backup your work!</Typography>
                <Box sx={{ fontFamily: "Monospace" }}>
                  <TextField
                    onFocus={(event) => event.target.select()}
                    multiline
                    maxRows={5}
                    fullWidth
                    value={this.state.aif}
                  />
                </Box>
              </Stack>
            )}
            {this.state.arguebuf && (
              <Stack spacing={1}>
                <Typography variant="h3">Arguebuf Export</Typography>
                <Typography variant="h6">Please copy this code to backup your work!</Typography>
                <Box sx={{ fontFamily: "Monospace" }}>
                  <TextField
                    onFocus={(event) => event.target.select()}
                    multiline
                    maxRows={5}
                    fullWidth
                    value={this.state.arguebuf}
                  />
                </Box>
              </Stack>
            )}
            <Stack direction="column" spacing={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reload page
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Clear cache and reload page
              </Button>
            </Stack>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
