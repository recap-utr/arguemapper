import * as arguebuf from "arguebuf";
import { useConfirm } from "material-ui-confirm";
import { enqueueSnackbar } from "notistack";
import { useCallback } from "react";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { useArgueActions } from "@/store.js";

/** Graph to replace the current one with, JSON objects and files are loaded first. */
export type GraphSource = model.Graph | arguebuf.load.JsonGraph | File;

async function load(
  source: GraphSource | undefined,
  onIssue: arguebuf.Reporter,
): Promise<model.Graph | undefined> {
  if (source === undefined || source instanceof arguebuf.Graph) {
    return source;
  }

  if (source instanceof File) {
    return convert.importFile(source, onIssue);
  }

  return convert.importGraph(source, onIssue);
}

/**
 * Replace the graph (an empty one by default), confirming it if the current one has content.
 * Graphs given as JSON or file are loaded first, their repairs and load errors are shown to the user.
 */
export function useReplaceGraph(): (source?: GraphSource) => void {
  const confirm = useConfirm();
  const { getState, resetState } = useArgueActions();

  return useCallback(
    (source) => {
      const issues: arguebuf.Issue[] = [];
      const replace = (graph: model.Graph | undefined) => {
        resetState(graph);

        if (issues.length > 0) {
          enqueueSnackbar(
            `The graph was repaired while loading it: ${issues.map(model.describeIssue).join(" ")}`,
            { variant: "warning" },
          );
        }
      };

      load(source, (issue) => issues.push(issue)).then(
        (graph) => {
          const { nodes, resources } = getState().graph;

          if (Object.keys(nodes).length === 0 && Object.keys(resources).length === 0) {
            replace(graph);

            return;
          }

          void confirm({
            title: "Replace the current graph?",
            description: "You can undo this afterwards.",
            confirmationText: "Replace",
          }).then(({ confirmed }) => {
            if (confirmed) replace(graph);
          });
        },
        (error: unknown) => {
          // invalid input throws a `GraphError` listing all problems with a hint
          const reason =
            error instanceof arguebuf.GraphError
              ? model.describeIssue(error.issue)
              : error instanceof Error
                ? error.message
                : String(error);
          enqueueSnackbar(`The graph could not be loaded: ${reason}`, { variant: "error" });
        },
      );
    },
    [confirm, getState, resetState],
  );
}
