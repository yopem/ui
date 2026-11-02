"use client"

import { Button } from "@registry/components/ui/button"
import {
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  BoldIcon,
  ItalicIcon,
  Redo2Icon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react"

export function DisabledEditorExample() {
  return (
    <EditorRoot ariaLabel="Disabled editor" editable={false}>
      <EditorToolbar>
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
        <EditorHistoryButton
          action="undo"
          aria-label="Undo"
          title="Undo"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Undo2Icon aria-hidden="true" size={16} />
        </EditorHistoryButton>
        <EditorHistoryButton
          action="redo"
          aria-label="Redo"
          title="Redo"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Redo2Icon aria-hidden="true" size={16} />
        </EditorHistoryButton>
      </EditorToolbar>
      <EditorContent
        aria-disabled="true"
        tabIndex={-1}
        placeholder="Editing is disabled."
      />
    </EditorRoot>
  )
}
