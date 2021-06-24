const elements = [];

for (let i = 0; i < 1000; i = i + 2) {
  elements.push(
    {
      id: i,
      type: "standard",
      data: {
        label: `Node ${i}`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: i + 1,
      type: "standard",
      data: {
        label: `Node ${i + 1}`,
      },
      position: { x: 0, y: 0 },
    },
    { id: `e${i}-${i + 1}`, source: i, target: i + 1 }
  );
}

// const elements = [
//   {
//     id: "1",
//     type: "input",
//     data: {
//       label: (
//         <>
//           Welcome to <strong>React Flow!</strong>
//         </>
//       ),
//     },
//     position: { x: 0, y: 0 },
//   },
//   {
//     id: "2",
//     data: {
//       label: (
//         <>
//           This is a <strong>default node</strong>
//         </>
//       ),
//     },
//     position: { x: 0, y: 0 },
//   },
//   {
//     id: "3",
//     data: {
//       label: (
//         <>
//           This one has a <strong>custom style</strong>
//         </>
//       ),
//     },
//     position: { x: 0, y: 0 },
//     style: {
//       background: "#D6D5E6",
//       color: "#333",
//       border: "1px solid #222138",
//       width: 180,
//     },
//   },
//   {
//     id: "4",
//     position: { x: 0, y: 0 },
//     data: {
//       label: "Another default node",
//     },
//   },
//   {
//     id: "5",
//     data: {
//       label: "Node id: 5",
//     },
//     position: { x: 0, y: 0 },
//   },
//   {
//     id: "6",
//     type: "output",
//     data: {
//       label: (
//         <>
//           An <strong>output node</strong>
//         </>
//       ),
//     },
//     position: { x: 0, y: 0 },
//   },
//   {
//     id: "7",
//     type: "output",
//     data: { label: "Another output node" },
//     position: { x: 0, y: 0 },
//   },
//   { id: "e1-2", source: "1", target: "2" },
//   { id: "e1-3", source: "1", target: "3" },
//   {
//     id: "e3-4",
//     source: "3",
//     target: "4",
//     animated: true,
//   },
//   {
//     id: "e4-5",
//     source: "4",
//     target: "5",
//   },
//   {
//     id: "e5-6",
//     source: "5",
//     target: "6",
//     type: "smoothstep",
//   },
//   {
//     id: "e5-7",
//     source: "5",
//     target: "7",
//     type: "smoothstep",
//     animated: true,
//   },
// ];

export default elements;
