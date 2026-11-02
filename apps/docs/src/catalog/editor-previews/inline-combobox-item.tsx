"use client"

import type { BaseUIEvent } from "@base-ui/react/types"
import type { AriaAttributes, MouseEvent, PointerEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
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
  useEditorInlineCombobox,
} from "@yopem-ui/editor/typeahead"
import { useId, useState } from "react"

function markOption(element: HTMLDivElement | null) {
  if (element) element.setAttribute("data-consumer-ref", element.role ?? "")
}

function ControllerOrder() {
  const { state } = useEditorInlineCombobox()

  return (
    <Box
      hidden
      data-testid="typeahead-controller-order"
      data-items={JSON.stringify(state.items.map((item) => item.id))}
    />
  )
}

function Suggestions({ record }: { record: (event: string) => void }) {
  const { state } = useEditorInlineCombobox()
  const labelId = useId()
  const descriptionId = useId()

  const renderDescriptions = new Map<string, AriaAttributes>([
    ["quote", { "aria-description": "Host description" }],
    [
      "code",
      {
        "aria-description": "Render description",
        "aria-describedby": descriptionId,
      },
    ],
    ["bullet", { "aria-description": "" }],
    ["number", { "aria-describedby": "" }],
  ])

  const handleClick = useStableCallback(function handleClick(
    event: BaseUIEvent<MouseEvent<HTMLDivElement>>,
  ) {
    const id = event.currentTarget.dataset.itemId

    record(`${id}:click:${event.currentTarget.role}`)

    if (id === "h4") event.preventDefault()

    if (id === "h5") event.preventBaseUIHandler()
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: BaseUIEvent<PointerEvent<HTMLDivElement>>,
  ) {
    const id = event.currentTarget.dataset.itemId

    if (id === "h6") event.preventDefault()

    if (id === "h3") event.preventBaseUIHandler()
  })

  return (
    <EditorInlineComboboxContent aria-label="Suggestions">
      <Text id={labelId}>Heading 1 command</Text>
      <Text id={descriptionId}>Consumer referenced description</Text>
      <EditorInlineComboboxList aria-label="Suggestions">
        <EditorInlineComboboxGroup items={state.items}>
          <EditorInlineComboboxGroupLabel>
            Suggestions
          </EditorInlineComboboxGroupLabel>
          {state.items.map((item) => (
            <EditorInlineComboboxItem
              key={item.id}
              item={item}
              data-item-id={item.id}
              render={
                <Box ref={markOption} {...renderDescriptions.get(item.id)} />
              }
              aria-label={
                item.id === "paragraph"
                  ? "Paragraph command"
                  : item.id === "h3"
                    ? "Heading 3 custom"
                    : undefined
              }
              aria-labelledby={item.id === "h1" ? labelId : undefined}
              aria-describedby={
                item.id === "h1"
                  ? descriptionId
                  : item.id === "table"
                    ? ""
                    : undefined
              }
              aria-description={
                item.id === "h2"
                  ? "Consumer description"
                  : item.id === "code"
                    ? "Top-level description"
                    : item.id === "check"
                      ? ""
                      : undefined
              }
              onClick={handleClick}
              onPointerMove={handlePointerMove}
            >
              {item.id === "h3" ? (
                <EditorInlineComboboxRow>
                  <Text>Heading 3 custom</Text>
                </EditorInlineComboboxRow>
              ) : undefined}
            </EditorInlineComboboxItem>
          ))}
        </EditorInlineComboboxGroup>
      </EditorInlineComboboxList>
    </EditorInlineComboboxContent>
  )
}

export function Preview() {
  const [event, setEvent] = useState("")

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
    <EditorRoot
      ariaLabel="EditorInlineComboboxItem preview"
      extensions={extensions}
    >
      <EditorInlineCombobox controller={controller}>
        <EditorInlineComboboxInput placeholder="Type /, @Ada, or :smile." />
        <ControllerOrder />
        <Suggestions record={setEvent} />
      </EditorInlineCombobox>
      <Box render={<output aria-label="Option event" />}>{event}</Box>
    </EditorRoot>
  )
}
