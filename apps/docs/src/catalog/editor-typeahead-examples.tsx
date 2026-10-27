"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorRoot,
  EditorContent,
  EditorToolbar,
  EditorHistoryButton,
} from "@yopem-ui/editor"
import {
  createEditorTypeahead,
  EditorTypeahead,
  EditorEmojiPopover,
  EditorEmojiPopoverContent,
  EditorEmojiToolbarButton,
  EditorEmojiPicker,
  EditorEmojiMenu,
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
  mentionIdentitySchema,
} from "@yopem-ui/editor/typeahead"
import { useReducer, useState } from "react"

const demoPeople = [
  { id: "ada", label: "Ada Lovelace" },
  { id: "grace", label: "Grace Hopper" },
]

export function EditorTypeaheadExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [mounted, toggleMounted] = useReducer(
    (current: boolean) => !current,
    true,
  )

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

export function EditorEmojiMenuExample() {
  return (
    <Box data-testid="emoji-preset-example">
      <EditorRoot ariaLabel="Emoji preset editor">
        <EditorToolbar>
          <EditorEmojiMenu />
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
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

export function EditorHTTPTypeaheadExample() {
  const [mounted, toggleMounted] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [controller] = useState(() =>
    createEditorTypeahead({
      mentions: {
        async load(query, signal) {
          const response = await fetch(
            `/typeahead-fixture?q=${encodeURIComponent(query)}`,
            { signal },
          )

          if (!response.ok) throw new Error("Mention search failed")

          return mentionIdentitySchema
            .array()
            .max(50)
            .parse(await response.json())
        },
      },
    }),
  )

  const [extensions] = useState(() => [controller.extension])

  return (
    <Stack>
      <Text>
        This HTTP integration needs a host search endpoint. Without it, search
        shows an error.
      </Text>
      <Button variant="outline" onClick={toggleMounted}>
        {mounted ? "Hide HTTP editor" : "Show HTTP editor"}
      </Button>
      {mounted ? (
        <EditorRoot ariaLabel="HTTP typeahead editor" extensions={extensions}>
          <EditorTypeahead controller={controller} />
        </EditorRoot>
      ) : null}
    </Stack>
  )
}
