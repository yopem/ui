"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Text } from "@registry/components/ui/text"
import {
  EditorRoot,
  EditorToolbar,
  EditorHistoryButton,
} from "@yopem-ui/editor"
import {
  createEditorTypeahead,
  EditorEmojiPopover,
  EditorEmojiPopoverContent,
  EditorEmojiToolbarButton,
  EditorEmojiPicker,
  EditorEmojiCategory,
  EditorEmojiSearch,
  EditorEmojiList,
  EditorEmojiEmpty,
  EditorEmojiPrevious,
  EditorEmojiNext,
  EditorEmojiClearHistory,
  EditorEmojiClearSearch,
  EditorEmojiPreview,
  EditorInlineCombobox,
  EditorInlineComboboxInput,
  EditorInlineComboboxContent,
  EditorInlineComboboxList,
  EditorInlineComboboxGroup,
  EditorInlineComboboxGroupLabel,
  EditorInlineComboboxItem,
  EditorInlineComboboxRow,
  EditorInlineComboboxEmpty,
  EditorInlineComboboxStatus,
  useEditorInlineCombobox,
} from "@yopem-ui/editor/typeahead"
import { useState } from "react"

const demoPeople = [
  { id: "ada", label: "Ada Lovelace" },
  { id: "grace", label: "Grace Hopper" },
]

export function Preview() {
  const [editable, setEditable] = useState(true)
  const [mounted, setMounted] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  const toggleMounted = useStableCallback(function toggleMounted() {
    setMounted((current) => !current)
  })

  const [controller] = useState(() =>
    createEditorTypeahead({
      mentions: {
        profileURL(id) {
          return `https://example.com/people/${encodeURIComponent(id)}`
        },
        load(query, signal) {
          signal.throwIfAborted()

          return Promise.resolve(
            demoPeople.filter((person) =>
              person.label
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
            ),
          )
        },
      },
    }),
  )

  const [extensions] = useState(() => [controller.extension])

  return (
    <Box data-testid="typeahead-example">
      <Text>Demo identities only. Type /, @Ada, or :woman_technologist.</Text>
      <Button
        variant="outline"
        aria-pressed={!editable}
        onClick={toggleEditable}
      >
        Read only
      </Button>
      <Button variant="outline" onClick={toggleMounted}>
        {mounted ? "Hide editor" : "Show editor"}
      </Button>
      {mounted ? (
        <EditorRoot
          ariaLabel="Typeahead editor"
          extensions={extensions}
          editable={editable}
        >
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
            <EditorEmojiPopover history={controller.emojiHistory}>
              <EditorEmojiToolbarButton />
              <EditorEmojiPopoverContent>
                <EditorEmojiPicker>
                  <EditorEmojiSearch />
                  <EditorEmojiCategory />
                  <EditorEmojiClearSearch />
                  <EditorEmojiList />
                  <EditorEmojiEmpty />
                  <EditorEmojiPreview />
                  <EditorEmojiPrevious />
                  <EditorEmojiNext />
                  <EditorEmojiClearHistory />
                </EditorEmojiPicker>
              </EditorEmojiPopoverContent>
            </EditorEmojiPopover>
          </EditorToolbar>
          <EditorInlineCombobox controller={controller}>
            <EditorInlineComboboxInput placeholder="Type a command, mention, or emoji alias." />
            <ComposedSuggestions />
          </EditorInlineCombobox>
        </EditorRoot>
      ) : null}
    </Box>
  )
}

function ComposedSuggestions() {
  const { state } = useEditorInlineCombobox()

  return (
    <EditorInlineComboboxContent aria-label="Editor suggestions">
      <EditorInlineComboboxList aria-label="Editor suggestions">
        <EditorInlineComboboxGroup items={state.items}>
          <EditorInlineComboboxGroupLabel>
            Suggestions
          </EditorInlineComboboxGroupLabel>
          {state.items.map((item) => (
            <EditorInlineComboboxItem key={item.id} item={item}>
              <EditorInlineComboboxRow>
                <Text>
                  {item.emoji ? `${item.emoji} ` : ""}
                  {item.label}
                </Text>
              </EditorInlineComboboxRow>
            </EditorInlineComboboxItem>
          ))}
        </EditorInlineComboboxGroup>
      </EditorInlineComboboxList>
      <EditorInlineComboboxEmpty />
      <EditorInlineComboboxStatus />
    </EditorInlineComboboxContent>
  )
}
