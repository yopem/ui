"use client"

import { Box } from "@registry/components/ui/box"
import { Text } from "@registry/components/ui/text"
import {
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  CalloutNode,
  EditorBlocksExtension,
  INSERT_EDITOR_CALLOUT_COMMAND,
  INSERT_EDITOR_TOGGLE_COMMAND,
  ToggleNode,
} from "@yopem-ui/editor/blocks"
import {
  EditorColumnsExtension,
  EditorColumnsGroupNode,
  INSERT_EDITOR_COLUMNS_COMMAND,
} from "@yopem-ui/editor/columns"
import {
  EditorDateExtension,
  EditorDateNode,
  INSERT_EDITOR_DATE_COMMAND,
} from "@yopem-ui/editor/date"
import {
  EditorFootnoteDefinitionNode,
  EditorFootnoteExtension,
  EditorFootnoteReferenceNode,
  INSERT_EDITOR_FOOTNOTE_COMMAND,
} from "@yopem-ui/editor/footnote"
import {
  $insertEditorMath,
  EditorMathExtension,
  EditorMathNode,
} from "@yopem-ui/editor/math"
import { EditorTocExtension, editorTocSlashCommand } from "@yopem-ui/editor/toc"
import {
  createEditorTypeahead,
  EditorEmojiCategory,
  EditorEmojiClearHistory,
  EditorEmojiClearSearch,
  EditorEmojiEmpty,
  EditorEmojiItem,
  EditorEmojiList,
  EditorEmojiNext,
  EditorEmojiPicker,
  EditorEmojiPopover,
  EditorEmojiPopoverContent,
  EditorEmojiPreview,
  EditorEmojiPrevious,
  EditorEmojiSearch,
  EditorEmojiToolbarButton,
  EditorInlineCombobox,
  EditorInlineComboboxContent,
  EditorInlineComboboxEmpty,
  EditorInlineComboboxGroup,
  EditorInlineComboboxGroupLabel,
  EditorInlineComboboxInput,
  EditorInlineComboboxItem,
  EditorInlineComboboxList,
  EditorInlineComboboxRow,
  EditorInlineComboboxStatus,
  editorEmojiInventory,
  useEditorEmojiPicker,
  useEditorInlineCombobox,
  type EditorSlashCommand,
  type MentionIdentity,
} from "@yopem-ui/editor/typeahead"
import { useState } from "react"

const slashCommands: readonly EditorSlashCommand[] = [
  editorTocSlashCommand(),
  {
    id: "callout",
    label: "Callout",
    description: "Insert a callout",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([CalloutNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([CalloutNode])) return
      editor.dispatchCommand(INSERT_EDITOR_CALLOUT_COMMAND, undefined)
    },
  },
  {
    id: "toggle",
    label: "Toggle",
    description: "Insert a toggle",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([ToggleNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([ToggleNode])) return
      editor.dispatchCommand(INSERT_EDITOR_TOGGLE_COMMAND, undefined)
    },
  },
  {
    id: "columns",
    label: "Two columns",
    description: "Insert two columns",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorColumnsGroupNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorColumnsGroupNode]))
        return
      editor.dispatchCommand(INSERT_EDITOR_COLUMNS_COMMAND, [50, 50])
    },
  },
  {
    id: "fixed-date",
    label: "Fixed date",
    description: "Insert the fixed date 2025-01-15",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorDateNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorDateNode])) return
      editor.dispatchCommand(INSERT_EDITOR_DATE_COMMAND, "2025-01-15")
    },
  },
  {
    id: "equation-inline",
    label: "Inline equation",
    description: "Insert an inline equation",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorMathNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorMathNode])) return
      $insertEditorMath({ kind: "inline", tex: "x^2" })
    },
  },
  {
    id: "equation-block",
    label: "Block equation",
    description: "Insert a block equation",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorMathNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorMathNode])) return
      $insertEditorMath({ kind: "block", tex: "x^2" })
    },
  },
  {
    id: "footnote",
    label: "Footnote",
    description: "Insert a footnote reference",
    available(editor) {
      return (
        editor.isEditable() &&
        editor.hasNodes([
          EditorFootnoteDefinitionNode,
          EditorFootnoteReferenceNode,
        ])
      )
    },
    run(editor) {
      if (
        !editor.isEditable() ||
        !editor.hasNodes([
          EditorFootnoteDefinitionNode,
          EditorFootnoteReferenceNode,
        ])
      )
        return
      editor.dispatchCommand(INSERT_EDITOR_FOOTNOTE_COMMAND, undefined)
    },
  },
]

const mentionFixture = [
  { id: "docs-fixture-ada", label: "Ada Lovelace" },
  { id: "docs-fixture-grace", label: "Grace Hopper" },
  { id: "docs-fixture-katherine", label: "Katherine Johnson" },
] satisfies readonly MentionIdentity[]

async function loadDocumentationMentionFixture(
  query: string,
  signal: AbortSignal,
) {
  signal.throwIfAborted()

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(finish, 300)

    function finish() {
      signal.removeEventListener("abort", abort)
      resolve()
    }

    function abort() {
      clearTimeout(timer)
      signal.removeEventListener("abort", abort)
      reject(new DOMException("Mention search cancelled.", "AbortError"))
    }

    signal.addEventListener("abort", abort, { once: true })

    if (signal.aborted) abort()
  })

  signal.throwIfAborted()

  if (query.length > 64) return []
  const normalizedQuery = query.trim().toLocaleLowerCase("en")

  return mentionFixture
    .filter((person) =>
      person.label.toLocaleLowerCase("en").includes(normalizedQuery),
    )
    .slice(0, 8)
}

function InlineSuggestions() {
  const { state } = useEditorInlineCombobox()

  return (
    <EditorInlineComboboxContent aria-label="Public typeahead suggestions">
      <EditorInlineComboboxList aria-label="Public typeahead suggestions">
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

export function PublicTypeaheadExample() {
  const [controller] = useState(() =>
    createEditorTypeahead({
      commands: slashCommands,
      emoji: editorEmojiInventory,
      mentions: { load: loadDocumentationMentionFixture },
    }),
  )

  const [extensions] = useState(() => [
    EditorBlocksExtension,
    EditorColumnsExtension,
    EditorDateExtension,
    EditorFootnoteExtension,
    EditorMathExtension,
    EditorTocExtension,
    controller.extension,
  ])

  return (
    <Box data-testid="public-typeahead-example">
      <Text>
        Documentation fixture identities only. Mention IDs grant no production
        access.
      </Text>
      <EditorRoot ariaLabel="Public typeahead editor" extensions={extensions}>
        <EditorToolbar>
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
          <EditorEmojiPopover
            history={controller.emojiHistory}
            inventory={editorEmojiInventory}
          >
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
        <EditorInlineCombobox controller={controller}>
          <EditorInlineComboboxInput placeholder="Type /, @name, or :emoji." />
          <InlineSuggestions />
        </EditorInlineCombobox>
      </EditorRoot>
    </Box>
  )
}
