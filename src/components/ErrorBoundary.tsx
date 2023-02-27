import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { ErrorInfo } from "react";
import * as convert from "../services/convert.js";

interface Props extends React.PropsWithChildren {}
interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  state: string | null;
  aif: string | null;
  arguebuf: string | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      state: null,
      aif: null,
      arguebuf: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const stateString = localStorage.getItem("state");
    let aif = null;
    let arguebuf = null;

    if (stateString) {
      const state = JSON.parse(stateString).state;
      const wrapper = {
        nodes: state.nodes,
        edges: state.edges,
        graph: state.graph,
      };

      try {
        aif = JSON.stringify(convert.exportGraph(wrapper, "aif"));
      } catch {}

      try {
        arguebuf = JSON.stringify(convert.exportGraph(wrapper, "arguebuf"));
      } catch {}
    }

    this.setState({
      error,
      errorInfo,
      state: stateString,
      aif,
      arguebuf,
    });
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <Container sx={{ paddingBottom: 10, paddingTop: 5 }}>
          <Stack spacing={5}>
            <Stack spacing={1}>
              <Typography variant="h3">Something went wrong…</Typography>
              <Typography variant="h6">
                {this.state.error ? this.state.error.toString() : "Error"}
              </Typography>
              <Typography variant="body1">
                {this.state.errorInfo.componentStack}
              </Typography>
            </Stack>
            {this.state.state && (
              <Stack spacing={1}>
                <Typography variant="h3">Application State</Typography>
                <Typography variant="h6">
                  Please copy this code to backup your work!
                </Typography>
                <Box fontFamily="Monospace">
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
                <Typography variant="h6">
                  Please copy this code to backup your work!
                </Typography>
                <Box fontFamily="Monospace">
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
                <Typography variant="h6">
                  Please copy this code to backup your work!
                </Typography>
                <Box fontFamily="Monospace">
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
