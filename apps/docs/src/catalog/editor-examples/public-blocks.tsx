"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorIndentButton,
  EditorLinkControl,
  EditorListButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  EditorCalloutAppearanceButton,
  EditorCalloutButton,
  EditorDisclosureButton,
  EditorToggleButton,
  EditorBlocksExtension,
  UPDATE_EDITOR_CALLOUT_COMMAND,
  editorCalloutAppearances,
} from "@yopem-ui/editor/blocks"
import { createEditorSelectionBookmark } from "@yopem-ui/editor/selection-bookmark"
import {
  EditorEmojiCategory,
  EditorEmojiEmpty,
  EditorEmojiItem,
  EditorEmojiList,
  EditorEmojiPopover,
  EditorEmojiPopoverContent,
  EditorEmojiPicker,
  EditorEmojiSearch,
  EditorEmojiToolbarButton,
  useEditorEmojiPicker,
} from "@yopem-ui/editor/typeahead"
import { HISTORY_PUSH_TAG, type EditorState } from "lexical"
import { useReducer, useState, useSyncExternalStore } from "react"

const extensions = [EditorBlocksExtension]

const styles = stylex.create({
  json: { overflowWrap: "anywhere", whiteSpace: "pre-wrap", margin: 0 },
})

function CalloutEmojiOption({
  item,
  bookmark,
  controller,
  valid,
}: {
  item: Parameters<typeof EditorEmojiItem>[0]["item"]
  bookmark: ReturnType<typeof createEditorSelectionBookmark>
  controller: ReturnType<typeof useEditorEmojiPicker>["controller"]
  valid: boolean
}) {
  const editor = useEditor()

  const selectEmoji = useStableCallback(function selectEmoji(
    event: MouseEvent<HTMLElement>,
  ) {
    event.preventDefault()

    if (!controller.getSnapshot().valid || !editor.isEditable()) return
    let applied = false
    editor.update(
      () => {
        if (!bookmark.restore()) return
        applied = editor.dispatchCommand(UPDATE_EDITOR_CALLOUT_COMMAND, {
          icon: item.emoji,
        })
      },
      { tag: HISTORY_PUSH_TAG },
    )

    if (!applied) return
    bookmark.clear()
    controller.setOpen(false)
    editor.focus()
  })

  return (
    <EditorEmojiItem item={item} disabled={!valid} onClick={selectEmoji}>
      {item.emoji} {item.label}
    </EditorEmojiItem>
  )
}

function CalloutEmojiItems({
  bookmark,
  valid,
}: {
  bookmark: ReturnType<typeof createEditorSelectionBookmark>
  valid: boolean
}) {
  const { controller, state } = useEditorEmojiPicker()

  return (
    <EditorEmojiList>
      {state.items.map((item) => (
        <CalloutEmojiOption
          key={item.id}
          item={item}
          bookmark={bookmark}
          controller={controller}
          valid={valid}
        />
      ))}
    </EditorEmojiList>
  )
}

function CalloutEmojiPicker() {
  const editor = useEditor()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))

  const valid = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const capture = useStableCallback(function capture() {
    editor.getEditorState().read(bookmark.capture)
  })

  return (
    <EditorEmojiPopover>
      <EditorEmojiToolbarButton
        aria-label="Choose callout icon"
        onClick={capture}
      >
        Callout icon
      </EditorEmojiToolbarButton>
      <EditorEmojiPopoverContent>
        <EditorEmojiPicker>
          <EditorEmojiSearch />
          <EditorEmojiCategory />
          <CalloutEmojiItems bookmark={bookmark} valid={valid} />
          <EditorEmojiEmpty />
        </EditorEmojiPicker>
      </EditorEmojiPopoverContent>
    </EditorEmojiPopover>
  )
}

export function PublicBlocksExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [documentJSON, setDocumentJSON] = useState("")

  const handleChange = useStableCallback(function handleChange(
    state: EditorState,
  ) {
    setDocumentJSON(JSON.stringify(state.toJSON()))
  })

  return (
    <Stack>
      <Button
        variant="outline"
        aria-pressed={!editable}
        onClick={toggleEditable}
      >
        {editable ? "Read-only blocks" : "Edit blocks"}
      </Button>
      <EditorRoot
        ariaLabel="Public blocks editor"
        extensions={extensions}
        editable={editable}
        onChange={handleChange}
      >
        <EditorToolbar aria-label="Public blocks">
          <EditorCalloutButton />
          <EditorToggleButton />
          {editorCalloutAppearances.map((appearance) => (
            <EditorCalloutAppearanceButton
              key={appearance}
              appearance={appearance}
            />
          ))}
          <CalloutEmojiPicker />
          <EditorLinkControl />
          <EditorDisclosureButton />
          <EditorIndentButton direction="indent" />
          <EditorIndentButton direction="outdent" />
          <EditorListButton listType="bullet" />
          <EditorFormatButton format="bold" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder="Insert and edit callouts and toggles…" />
        <Box render={<section />} aria-label="Blocks document JSON">
          <Box render={<pre />} xstyle={styles.json}>
            {documentJSON}
          </Box>
        </Box>
      </EditorRoot>
    </Stack>
  )
}
