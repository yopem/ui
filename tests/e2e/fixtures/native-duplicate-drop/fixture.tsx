import {
  EditorContent,
  EditorRoot,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical"
import { useState } from "react"
import { createRoot } from "react-dom/client"

const mime = "application/x-lexical-editor"

const marker = "application/x-lexical-drag"

const valid =
  '{"namespace":"yopem-ui-editor","nodes":[{"type":"paragraph","version":1,"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"DRAGGED"}],"direction":null,"format":"","indent":0,"textFormat":0,"textStyle":""}]}'

const duplicate = valid.replace(
  '"text":"DRAGGED"',
  '"text":"ORIGINAL","t\\u0065xt":"DRAGGED"',
)

const editors = new Map<string, LexicalEditor>()

const events: object[] = []

let payload = duplicate

let cancel = false

type Snapshot = ReturnType<typeof snapshot>

declare global {
  interface Window {
    duplicateDropFixture: {
      configure: (mode: "duplicate" | "valid", hostCancel: boolean) => void
      snapshot: () => Snapshot
      history: (id: string, action: "undo" | "redo") => void
      valid: string
      duplicate: string
    }
  }
}

function snapshot() {
  const selection = document.getSelection()

  return {
    editors: Object.fromEntries(
      Array.from(editors, ([id, editor]) => [
        id,
        {
          json: editor.getEditorState().toJSON(),
          selection: editor.getEditorState().read(() => {
            const range = $getSelection()

            return $isRangeSelection(range)
              ? {
                  anchor: {
                    key: range.anchor.key,
                    offset: range.anchor.offset,
                    type: range.anchor.type,
                  },
                  focus: {
                    key: range.focus.key,
                    offset: range.focus.offset,
                    type: range.focus.type,
                  },
                  text: range.getTextContent(),
                }
              : null
          }),
          editable: editor.isEditable(),
          canUndo: document
            .querySelector(`[data-history="${id}"]`)
            ?.getAttribute("data-undo"),
          canRedo: document
            .querySelector(`[data-history="${id}"]`)
            ?.getAttribute("data-redo"),
        },
      ]),
    ),
    dom: {
      text: selection?.toString(),
      anchorOffset: selection?.anchorOffset,
      focusOffset: selection?.focusOffset,
      anchorParent: selection?.anchorNode?.parentElement
        ?.closest("[contenteditable]")
        ?.getAttribute("aria-label"),
      focusParent: selection?.focusNode?.parentElement
        ?.closest("[contenteditable]")
        ?.getAttribute("aria-label"),
      active: document.activeElement?.getAttribute("aria-label"),
    },
    events: [...events],
  }
}

window.duplicateDropFixture = {
  configure(mode, hostCancel) {
    payload = mode === "valid" ? valid : duplicate
    cancel = hostCancel
    events.length = 0
  },
  snapshot,
  history(id, action) {
    const editor = editors.get(id)

    if (!editor) throw new Error(`Missing editor ${id}`)
    editor.dispatchCommand(
      action === "undo" ? UNDO_COMMAND : REDO_COMMAND,
      undefined,
    )
  },
  valid,
  duplicate,
}

for (const type of [
  "dragstart",
  "dragover",
  "drop",
  "dragend",
  "beforeinput",
  "input",
]) {
  document.addEventListener(
    type,
    (event) => {
      const drag = event instanceof DragEvent ? event : null
      const input = event instanceof InputEvent ? event : null
      const transfer = drag?.dataTransfer ?? input?.dataTransfer

      const caret =
        drag && type === "drop"
          ? document.caretRangeFromPoint(drag.clientX, drag.clientY)
          : null

      const record = {
        type,
        trusted: event.isTrusted,
        cancelable: event.cancelable,
        prevented: event.defaultPrevented,
        inputType: input?.inputType ?? null,
        target:
          event.target instanceof Element
            ? (event.target
                .closest("[contenteditable]")
                ?.getAttribute("aria-label") ?? null)
            : null,
        marker:
          type === "drop" || type === "dragend"
            ? (transfer?.getData(marker) ?? null)
            : null,
        raw: type === "drop" ? (transfer?.getData(mime) ?? null) : null,
        html: type === "drop" ? (transfer?.getData("text/html") ?? null) : null,
        plain:
          type === "drop" ? (transfer?.getData("text/plain") ?? null) : null,
        dropEffect: drag?.dataTransfer?.dropEffect ?? null,
        caret: caret
          ? {
              text: caret.startContainer.textContent,
              offset: caret.startOffset,
            }
          : null,
      }

      events.push(record)
      queueMicrotask(() => {
        record.prevented = event.defaultPrevented
      })
    },
    true,
  )
}

document.addEventListener("dragstart", (event) => {
  if (!event.isTrusted || !event.dataTransfer) return
  const actualMarker = event.dataTransfer.getData(marker)
  events.push({
    type: "source-payload",
    trusted: event.isTrusted,
    marker: actualMarker,
    raw: payload,
  })
  event.dataTransfer.setData(mime, payload)
  event.dataTransfer.setData("text/html", "<p>HTML FALLBACK</p>")
  event.dataTransfer.setData("text/plain", "PLAIN FALLBACK")
})

function Observer({ id }: { id: string }) {
  const editor = useEditor()
  const state = useEditorState()

  const [connect] = useState(() => {
    let unregister: (() => void) | undefined

    return function connect(element: HTMLDivElement | null) {
      if (!element) {
        unregister?.()
        unregister = undefined
        editors.delete(id)

        return
      }

      editors.set(id, editor)
      unregister = editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          if (!cancel) return false
          events.push({ type: "host-veto", id, trusted: event.isTrusted })
          event.preventDefault()

          return true
        },
        COMMAND_PRIORITY_HIGH,
      )
    }
  })

  return (
    <div
      ref={connect}
      data-history={id}
      data-undo={String(state.canUndo)}
      data-redo={String(state.canRedo)}
    />
  )
}

function initial(text: string) {
  return JSON.stringify({
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
          textFormat: 0,
          textStyle: "",
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
            },
          ],
        },
      ],
    },
  })
}

function FixtureEditor({ id, text }: { id: string; text: string }) {
  return (
    <EditorRoot ariaLabel={id} initialState={initial(text)}>
      <Observer id={id} />
      <EditorContent aria-label={id} />
    </EditorRoot>
  )
}

const mount = document.getElementById("root")

if (!mount) throw new Error("Missing fixture root")

createRoot(mount).render(
  <>
    <FixtureEditor id="source" text="DRAGGED source tail" />
    <FixtureEditor id="target" text="Target destination" />
  </>,
)
