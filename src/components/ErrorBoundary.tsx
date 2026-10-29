import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import React, { type ErrorInfo, type ReactNode } from "react";
import * as convert from "@/services/convert.js";
import { readState } from "@/store/storage.js";

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  state: string | null;
  aif: string | null;
  arguebuf: string | null;
}

/** Recovery screen of the app that offers the persisted graph for download. */
class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
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
    let stateString = null;
    let aif = null;
    let arguebufJson = null;

    // Reading and re-exporting the persisted graph must never throw here, or the recovery screen would
    // itself crash (e.g. on a corrupt persisted state) and leave the user with a blank page.
    try {
      stateString = localStorage.getItem("state");
      const persisted = readState("state");

      if (persisted !== null) {
        const { graph, analyst } = persisted.state;

        try {
          aif = JSON.stringify(convert.exportGraph(graph, "aif", analyst));
        } catch {
          /* empty */
        }

        try {
          arguebufJson = JSON.stringify(convert.exportGraph(graph, "arguebuf", analyst));
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

  render(): ReactNode {
    if (this.state.error && this.state.errorInfo) {
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
