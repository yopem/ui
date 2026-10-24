function paragraph(text: string) {
  return {
    direction: null,
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        type: "text",
        version: 1,
      },
    ],
  }
}

export const editorColumnFixture = JSON.stringify({
  root: {
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
    children: [
      {
        type: "editor-columns-group",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        layout: [60, 40],
        children: [
          {
            type: "editor-column",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
            children: [paragraph("Left column content")],
          },
          {
            type: "editor-column",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
            children: [paragraph("Right column content")],
          },
        ],
      },
    ],
  },
})
