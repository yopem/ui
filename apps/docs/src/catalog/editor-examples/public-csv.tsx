"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { mergeRegister } from "@lexical/utils"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorTableMenu,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EDITOR_CSV_PASTE_RESULT_COMMAND,
  EditorCsvExtension,
} from "@yopem-ui/editor/csv"
import { EditorTablePresentationExtension } from "@yopem-ui/editor/table-presentation"
import {
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  configExtension,
  defineExtension,
  PASTE_COMMAND,
} from "lexical"
import { Redo2Icon, TablePropertiesIcon, Undo2Icon } from "lucide-react"
import { useState } from "react"

export function CsvEditorExample() {
  const [error, setError] = useState("")
  const [veto, setVeto] = useState(false)
  const [readOnly, setReadOnly] = useState(false)

  const [policy] = useState(() => {
    let enabled = false

    return {
      isEnabled() {
        return enabled
      },
      toggle() {
        enabled = !enabled

        return enabled
      },
    }
  })

  const [extensions] = useState(() => [
    configExtension(EditorTablePresentationExtension, { pasteTsv: false }),
    EditorCsvExtension,
    defineExtension({
      name: "@example/csv-policy",
      register(editor) {
        return mergeRegister(
          editor.registerCommand(
            PASTE_COMMAND,
            (event) => {
              if (!policy.isEnabled()) return false
              event.preventDefault()

              return true
            },
            COMMAND_PRIORITY_HIGH,
          ),
          editor.registerCommand(
            EDITOR_CSV_PASTE_RESULT_COMMAND,
            (result) => {
              setError(result.ok ? "" : `CSV paste rejected: ${result.reason}`)

              return false
            },
            COMMAND_PRIORITY_LOW,
          ),
        )
      },
    }),
  ])

  const toggleVeto = useStableCallback(function toggleVeto() {
    setVeto(policy.toggle())
  })

  const toggleReadOnly = useStableCallback(function toggleReadOnly() {
    setReadOnly((current) => !current)
  })

  return (
    <Stack>
      <Text>
        Paste comma-separated rows. Quoted fields can contain commas, escaped
        quotes, and line breaks. Clipboard HTML and native Lexical content keep
        priority.
      </Text>
      <Button aria-pressed={veto} onClick={toggleVeto}>
        Host paste veto
      </Button>
      <Button aria-pressed={readOnly} onClick={toggleReadOnly}>
        CSV read only
      </Button>
      <EditorRoot
        ariaLabel="CSV editor"
        editable={!readOnly}
        extensions={extensions}
      >
        <EditorToolbar aria-label="CSV editing actions">
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
          <EditorTableMenu
            aria-label="Table actions"
            title="Table actions"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <TablePropertiesIcon aria-hidden="true" size={16} />
          </EditorTableMenu>
        </EditorToolbar>
        <EditorContent placeholder="Paste a CSV table" />
      </EditorRoot>
      {error ? <Text role="alert">{error}</Text> : null}
      <Text>
        CSV input is limited to 1 MiB and 50 by 50 cells. Rows must have the
        same width. Paste inside an existing table inserts a new table after it.
        Native line breaks use LF.
      </Text>
    </Stack>
  )
}
