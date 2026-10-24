"use client"

import { EditorCode } from "@yopem-ui/editor/code"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "code",
        version: 1,
        language: "javascript",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "text",
            version: 1,
            text: "const value={count:1}",
            format: 0,
            style: "",
            mode: "normal",
            detail: 0,
          },
        ],
      },
    ],
  },
})

export function Preview() {
  return (
    <EditorCode ariaLabel="EditorCode preview" initialState={initialState} />
  )
}
