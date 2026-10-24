"use client"

import { Text } from "@registry/components/ui/text"
import { EditorRoot } from "@yopem-ui/editor"
import {
  createEditorTypeahead,
  EditorInlineCombobox,
  EditorInlineComboboxInput,
  EditorInlineComboboxContent,
  EditorInlineComboboxList,
  EditorInlineComboboxItem,
  EditorInlineComboboxGroup,
  EditorInlineComboboxGroupLabel,
  EditorInlineComboboxRow,
  EditorInlineComboboxEmpty,
  EditorInlineComboboxStatus,
  useEditorInlineCombobox,
} from "@yopem-ui/editor/typeahead"
import { useState } from "react"

function Suggestions() {
  const { state } = useEditorInlineCombobox()

  return (
    <EditorInlineComboboxContent aria-label="Suggestions">
      <EditorInlineComboboxList aria-label="Suggestions">
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

export function InlineComboboxExample({
  ariaLabel = "Inline combobox editor",
}: {
  ariaLabel?: string
}) {
  const [controller] = useState(() =>
    createEditorTypeahead({
      mentions: {
        load(query, signal) {
          signal.throwIfAborted()

          return Promise.resolve(
            [{ id: "ada", label: "Ada" }].filter((person) =>
              person.label.toLowerCase().includes(query.toLowerCase()),
            ),
          )
        },
      },
    }),
  )

  const [extensions] = useState(() => [controller.extension])

  return (
    <EditorRoot ariaLabel={ariaLabel} extensions={extensions}>
      <EditorInlineCombobox controller={controller}>
        <EditorInlineComboboxInput placeholder="Type /, @Ada, or :smile." />
        <Suggestions />
      </EditorInlineCombobox>
    </EditorRoot>
  )
}
