import * as arguebuf from "arguebuf";
import { getErrorMessage } from "react-error-boundary";
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
 * Replace the graph (an empty one by default), which the user can undo.
 * Graphs given as JSON or file are loaded first, their repairs and load errors are shown to the user.
 */
export function useReplaceGraph(): (source?: GraphSource) => void {
  const { resetState, notify } = useArgueActions();

  return useCallback(
    (source) => {
      const issues: arguebuf.Issue[] = [];

      load(source, (issue) => issues.push(issue)).then(
        (graph) => {
          resetState(graph);

          if (issues.length > 0) {
            notify(
              `The graph was repaired while loading it: ${issues.map(model.describeIssue).join(" ")}`,
              "warning",
            );
          }
        },
        (error: unknown) => {
          // invalid input throws a `GraphError` listing all problems with a hint
          const reason =
            error instanceof arguebuf.GraphError
              ? model.describeIssue(error.issue)
              : (getErrorMessage(error) ?? String(error));
          notify(`The graph could not be loaded: ${reason}`, "error");
        },
      );
    },
    [resetState, notify],
  );
}
