"use client"

import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Editor } from "@yopem-ui/editor"

function textNode(text: string, format = 0) {
  return {
    type: "text",
    version: 1,
    detail: 0,
    mode: "normal",
    style: "",
    format,
    text,
  }
}

const element = { version: 1, direction: null, format: "", indent: 0 }

const initialState = JSON.stringify({
  root: {
    ...element,
    type: "root",
    children: [
      {
        ...element,
        type: "heading",
        tag: "h2",
        children: [textNode("Read-only guide")],
      },
      {
        ...element,
        type: "paragraph",
        children: [
          textNode("Bold content", 1),
          textNode(" and "),
          textNode("Italic content", 2),
        ],
      },
      {
        ...element,
        type: "quote",
        children: [textNode("Quoted content stays selectable.")],
      },
      {
        ...element,
        type: "paragraph",
        children: [
          {
            ...element,
            type: "link",
            url: "https://ui.yopem.com/docs/editor",
            target: "_self",
            rel: "noreferrer",
            children: [textNode("Editor guide")],
          },
        ],
      },
    ],
  },
})

export function ReadOnlyEditorExample() {
  return (
    <Stack>
      <Text>
        Select and copy rich content. Links stay usable. Formatting and document
        input stay disabled.
      </Text>
      <Editor
        ariaLabel="Read-only rich document"
        editable={false}
        initialState={initialState}
      />
    </Stack>
  )
}
