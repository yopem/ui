"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorBlockButton,
  EditorContent,
  EditorFormatButton,
  EditorRoot,
  useEditor,
} from "@yopem-ui/editor"
import { EditorFloatingToolbar } from "@yopem-ui/editor/floating-toolbar"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  HISTORY_PUSH_TAG,
} from "lexical"
import {
  BoldIcon,
  Heading2Icon,
  ItalicIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
} from "lucide-react"
import { useReducer, type KeyboardEvent } from "react"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
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
            text: "Select this sentence to open the floating toolbar.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

export function PublicFloatingToolbarExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  return (
    <Stack>
      <Text>
        Select text with a pointer or keyboard. Click a toolbar control once, or
        press Alt+F10 to focus the toolbar. Press Alt+Shift+R while it has focus
        to replace the document.
      </Text>
      <Button variant="outline" onClick={toggleEditable}>
        {editable ? "Make editor read-only" : "Enable editor editing"}
      </Button>
      <EditorRoot
        ariaLabel="Floating toolbar editor"
        editable={editable}
        initialState={initialState}
      >
        <FloatingExampleControls />
        <EditorContent placeholder="Select text to format" />
      </EditorRoot>
    </Stack>
  )
}

export function FloatingExampleControls() {
  const editor = useEditor()

  const handleHostShortcut = useStableCallback(function handleHostShortcut(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (
      event.defaultPrevented ||
      !event.altKey ||
      !event.shiftKey ||
      event.key.toLowerCase() !== "r" ||
      !editor.isEditable()
    )
      return
    event.preventDefault()
    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode("Host replacement paragraph."),
        )

        $getRoot().clear().append(paragraph)
        paragraph.selectEnd()
      },
      { tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  })

  return (
    <EditorFloatingToolbar
      aria-label="Text formatting"
      onKeyDownCapture={handleHostShortcut}
    >
      <EditorFormatButton
        format="bold"
        title="Bold"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <BoldIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton
        format="italic"
        title="Italic"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <ItalicIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton
        format="underline"
        title="Underline"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <UnderlineIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton
        format="strikethrough"
        title="Strikethrough"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <StrikethroughIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton
        format="subscript"
        title="Subscript"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <SubscriptIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton
        format="superscript"
        title="Superscript"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <SuperscriptIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorBlockButton
        block="h2"
        aria-label="Heading 2"
        title="Heading 2"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <Heading2Icon aria-hidden="true" size={16} />
      </EditorBlockButton>
    </EditorFloatingToolbar>
  )
}
