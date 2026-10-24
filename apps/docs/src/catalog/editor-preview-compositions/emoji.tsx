"use client"

import { EditorRoot, EditorContent, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorEmojiPopover,
  EditorEmojiToolbarButton,
  EditorEmojiPopoverContent,
  EditorEmojiPicker,
  EditorEmojiCategory,
  EditorEmojiSearch,
  EditorEmojiClearSearch,
  EditorEmojiList,
  EditorEmojiItem,
  EditorEmojiEmpty,
  EditorEmojiPreview,
  EditorEmojiPrevious,
  EditorEmojiNext,
  EditorEmojiClearHistory,
  useEditorEmojiPicker,
} from "@yopem-ui/editor/typeahead"

function EmojiResults() {
  const { state } = useEditorEmojiPicker()

  return (
    <EditorEmojiList>
      {state.items.map((item) => (
        <EditorEmojiItem key={item.id} item={item}>
          {item.emoji} {item.label}
        </EditorEmojiItem>
      ))}
    </EditorEmojiList>
  )
}

export function EmojiExample({
  ariaLabel = "Emoji editor",
}: {
  ariaLabel?: string
}) {
  return (
    <EditorRoot ariaLabel={ariaLabel}>
      <EditorToolbar aria-label="Formatting">
        <EditorEmojiPopover>
          <EditorEmojiToolbarButton>Emoji</EditorEmojiToolbarButton>
          <EditorEmojiPopoverContent>
            <EditorEmojiPicker>
              <EditorEmojiSearch />
              <EditorEmojiCategory />
              <EditorEmojiClearSearch />
              <EmojiResults />
              <EditorEmojiEmpty />
              <EditorEmojiPreview />
              <EditorEmojiPrevious />
              <EditorEmojiNext />
              <EditorEmojiClearHistory />
            </EditorEmojiPicker>
          </EditorEmojiPopoverContent>
        </EditorEmojiPopover>
      </EditorToolbar>
      <EditorContent placeholder="Click here, then open Emoji." />
    </EditorRoot>
  )
}
