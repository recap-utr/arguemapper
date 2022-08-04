import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { ErrorInfo } from "react";
import * as model from "../model";
import { proto2json } from "../services/convert";

interface Props extends React.PropsWithChildren {}
interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  graph: string | null;
  aif: string | null;
  arguebuf: string | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      graph: null,
      aif: null,
      arguebuf: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const graph = localStorage.getItem("graph");
    let aif = null;
    let arguebuf = null;

    if (graph) {
      try {
        aif = JSON.stringify(model.toAif(JSON.parse(graph)));
      } catch {}

      try {
        arguebuf = JSON.stringify(
          proto2json(model.toProtobuf(JSON.parse(graph)))
        );
      } catch {}
    }

    this.setState({
      error,
      errorInfo,
      graph,
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
            {this.state.graph && (
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
                    value={this.state.graph}
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
            {this.state.graph && (
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
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Clear cache and reload page
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
