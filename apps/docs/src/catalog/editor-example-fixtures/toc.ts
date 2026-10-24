export const editorTocFixture = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      { type: "editor-toc", version: 1 },
      {
        type: "heading",
        version: 1,
        tag: "h2",
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text: "Example Content",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text: "Change this heading to update the live overview.",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
      {
        type: "heading",
        version: 1,
        tag: "h3",
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text: "Subsection",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})
