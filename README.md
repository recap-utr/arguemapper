# ArgueMapper

The ArgueMapper tool can be used to convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs.
Existing tools to create argument graphs are tailored for experts in the domain of argumentation.
ArgueMapper is the first of its kind to be optimized for mobile devices and provide a discoverable interface suitable for novice users.
You can try it out immediately by visiting our [hosted version](https://arguemapper.uni-trier.de).
There are no server-side components in this app, so your data never leaves your device.

## Docker Image

```shell
docker run -p 8080:8080 ghcr.io/recap-utr/arguemapper
```

## Embedding in a React app

ArgueMapper ships two embeddable components, layered on a shared rendering core, for different needs:

- **`<GraphViewer>`** — a pure, externally **controlled** viewer. The `graph` prop is the single source of truth (updating it re-renders the view); there is no editing. Built for presenting many small argument graphs at once, with an optional minimap, zoom/fit controls, auto-layout for unpositioned graphs, and selection/click callbacks.
- **`<GraphEditor>`** — the full embeddable editor (the standalone ArgueMapper app is one configuration of it). It edits the `graph` prop and reports each new graph via `onGraphChange`. Editing, the toolbar (`toolbar`), the text and details panels (`panels`), and the AI assistant are opt-in props, and `slots` adds host content to the file menu and the settings.
  The same components adapt to desktops, tablets, and phones: wide editors show the panels beside the canvas, narrow ones below it, and touch input enlarges the interactive elements.

Both need no wrapper. They use the MUI theme of the host, e.g. `createTheme({ colorSchemes: { dark: true } })` to follow the dark mode of the OS, or MUI's default theme without a `ThemeProvider`.

```tsx
import {
  type Graph,
  type GraphEditorHandle,
  type GraphJson,
  GraphEditor,
  GraphViewer,
  importGraph,
} from "arguemapper";
import { useRef, useState } from "react";

function Example({ graphs, json }: { graphs: Graph[]; json: GraphJson }) {
  const ref = useRef<GraphEditorHandle>(null);
  const [graph, setGraph] = useState(() => importGraph(json));

  return (
    <>
      {/* Present several small graphs read-only; click one to drill in */}
      {graphs.map((g, i) => (
        <div key={i} style={{ height: 240 }}>
          <GraphViewer graph={g} minimap controls onNodeClick={(node) => console.log(node)} />
        </div>
      ))}

      {/* A full editor that reports changes back to the host */}
      <div style={{ height: 600 }}>
        <GraphEditor
          ref={ref}
          graph={graph}
          onGraphChange={setGraph}
          toolbar
          panels
          assistant
        />
      </div>
    </>
  );
}
```

`<GraphViewer>` is controlled — pass `graph` (keep it referentially stable unless it actually changes), react via `onNodeClick`/`onEdgeClick` (which receive the arguebuf node or edge) and `onSelectionChange` (which receives the selected ids), and use its imperative `ref` (`fitView`, `zoomIn`, `zoomOut`, `layout`).
`<GraphEditor>` edits the `graph` prop: a new graph from the host replaces the current one as an edit that can be undone, and `onGraphChange` receives the graph after each change, so it can be passed back.
Graphs are immutable arguebuf graphs, so sharing them between the host and the editor is safe, `importGraph` and `exportGraph` convert them from and to JSON.
The imperative `ref` (`exportGraph`, `clear`, `fitView`, `undo`/`redo`, …) offers explicit actions.
`assistant` enables the AI assistant, settings passed as an object (e.g. `assistant={{ baseURL, model }}`) are fixed and hidden from its settings dialog.
The `peerDependencies` in `package.json` (React, MUI, emotion, xyflow, arguebuf, …) must be provided by the host, so its copies are reused.

## Tutorial

ArgueMapper saves your work in the browser, so it is still there after reloading the page.

### Terms

- A **claim** (atom node) is a statement of the text, e.g. a premise or a conclusion.
- A **relation** (scheme node) connects claims and says whether one supports, attacks, rephrases, or is preferred to another. Support relations can also name an argumentation scheme, e.g. expert opinion.
- The **main claim** (major claim) is the conclusion of the whole text.

### Create a graph from a text

1. Paste the text you want to analyze into the **Text** panel and choose **Start annotating**.
2. Select a passage of the text and choose **Add claim**. If a claim is selected on the canvas, you can also add the passage as a claim that **supports** or **attacks** it, or **use it as the quote** of the selected claim.
3. Drag from the dot of one claim to another claim to connect them. A new support relation is placed between them. Dropping the connection on the empty canvas creates a new claim there. While dragging, the elements that cannot be connected are dimmed.
4. Select a relation to switch between support and attack in the toolbar above it, or open **Details** for all options.
5. Select a claim and mark it as the main claim with the star in its toolbar.

Clicking a highlighted passage selects its claim on the canvas, and **Show in text** in the toolbar of a claim scrolls to its passage.
The **Getting started** guide on the canvas checks off these steps as you go and offers a small finished example.
It can be hidden and shown again in the settings.

### Panels

The buttons at the top right of the canvas open the closed panels.
An open panel is switched with the tabs in its header and hidden with its close button.

- **Text**: the texts of the graph with their annotated passages. The plus adds another text and the pen switches to editing the title, the text, and its source.
- **Details**: the fields of the selected elements, with rarely needed ones such as notes and IDs under **More**. While nothing is selected, it shows the notes and the authors of the graph.
- **Assistant**: an AI assistant that can extract claims and relations from the text, if enabled.

### File menu and settings

- **File** starts a new graph, opens a file (Arguebuf, AIF, xAIF, OVA, SADFace, or Argdown as JSON, Argdown source, brat standoff, or a Kialo export), loads the example, and downloads the graph as Arguebuf or AIF (JSON) or as an image (PNG or JPG). Exports ask once for your name and email, which are saved in the file.
- The gear opens the settings for the arrangement of the graph, the style of connections, the image resolution, and readable JSON files.

### Canvas controls

The controls at the bottom left zoom, fit the graph into view, arrange it automatically, undo and redo changes (Ctrl+Z and Ctrl+Y), and add a claim without text.
Delete selected elements with the Delete key or the trash can in their toolbar.
Double-click a claim or press F2 to edit its text right on the canvas, Enter saves and Escape cancels, Shift+Enter starts a new line.
Double-click the empty canvas to add a claim there.
Drag an end of a connection to another element to reconnect it.
