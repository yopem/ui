import { EditorCalloutClipboardExtension } from "@editor/blocks-clipboard"
import {
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
} from "@editor/blocks-model"
import {
  $getClipboardDataFromSelection,
  GetClipboardDataExtension,
} from "@lexical/clipboard"
import {
  getPeerDependencyFromEditor,
  buildEditorFromExtensions,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { $generateNodesFromDOM } from "@lexical/html"
import { ListNode, ListItemNode } from "@lexical/list"
import { RichTextExtension, HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table"
import {
  COMMAND_PRIORITY_HIGH,
  CUT_COMMAND,
  CUT_TAG,
  $createNodeSelection,
  $setSelection,
  $getRoot,
  $getSelection,
  configExtension,
  defineExtension,
} from "lexical"

const policyMode = new URL(location.href).searchParams.get("policy")

const cutMode = new URL(location.href).searchParams.get("cut")

const cutPosition = new URL(location.href).searchParams.get("position")

const cutCalls = []

const registration = []

const calls = []

function state(editor) {
  return editor.read(() => {
    const selection = $getSelection()

    return JSON.stringify({
      json: editor.getEditorState().toJSON(),
      anchor: selection?.anchor,
      focus: selection?.focus,
      nodes: selection?.getNodes().map((node) => node.getKey()),
    })
  })
}

function policy(position) {
  function handler(mime) {
    return (selection, next) => {
      const live = $getSelection()

      const before = JSON.stringify({
        anchor: live?.anchor,
        focus: live?.focus,
      })

      calls.push({ position, mime, live: selection === live })

      if (policyMode === `stop-${position}` && mime !== "text/plain")
        return null
      const value = next()

      if (
        before !== JSON.stringify({ anchor: live?.anchor, focus: live?.focus })
      )
        throw new Error("Live selection changed")

      if (policyMode === `veto-${position}` && mime !== "text/plain")
        return null

      if (value === null) return null

      return policyMode === "transform" && mime !== "text/plain"
        ? value.replaceAll(
            position === "earlier" ? "Rich" : "Second",
            position === "earlier" ? "Safe" : "Filtered",
          )
        : value
    }
  }

  return defineExtension({
    name: `host-policy-${position}`,
    dependencies: [
      configExtension(GetClipboardDataExtension, {
        $exportMimeType: {
          "text/html": [handler("text/html")],
          "application/x-lexical-editor": [
            handler("application/x-lexical-editor"),
          ],
          "text/plain": [handler("text/plain")],
          "application/x-host": [
            (selection, next) => {
              calls.push({
                position,
                mime: "application/x-host",
                live: selection === $getSelection(),
              })

              return `${next() ?? "host"}:${position}`
            },
          ],
        },
      }),
    ],
  })
}

function cutPolicy() {
  return defineExtension({
    name: "host-cut-policy",
    register(editor) {
      registration.push("host")

      return editor.registerCommand(
        CUT_COMMAND,
        (event) => {
          cutCalls.push(cutMode)

          if (cutMode === "track") return false
          event.preventDefault()

          if (cutMode === "custom")
            event.clipboardData.setData("text/plain", "Host owns cut")

          return true
        },
        COMMAND_PRIORITY_HIGH,
      )
    },
  })
}

function history() {
  const value = getPeerDependencyFromEditor(
    source,
    HistoryExtension.name,
  ).output.historyState.peek()

  return {
    undo: value.undoStack.map((entry) => entry.editorState.toJSON()),
    redo: value.redoStack.map((entry) => entry.editorState.toJSON()),
    current: value.current?.editorState.toJSON(),
  }
}

function makeEditor(id, blocks, namespace) {
  const root = document.createElement("div")
  root.id = id
  root.contentEditable = "true"
  root.setAttribute("role", "textbox")
  root.setAttribute("aria-label", id)
  document.body.append(root)

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: id,
      namespace,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        TableNode,
        TableRowNode,
        TableCellNode,
        ...(blocks
          ? [CalloutNode, ToggleNode, ToggleSummaryNode, ToggleBodyNode]
          : []),
      ],
      dependencies: [
        RichTextExtension,
        HistoryExtension,
        ...(blocks
          ? [
              ...(policyMode ? [policy("earlier")] : []),
              ...(cutMode && cutPosition === "before" ? [cutPolicy()] : []),
              defineExtension({
                name: "helper-registration-start",
                register() {
                  registration.push("helper")

                  return () => {
                    registration.splice(registration.indexOf("helper"), 1)
                  }
                },
              }),
              EditorCalloutClipboardExtension,
              ...(cutMode && cutPosition === "after" ? [cutPolicy()] : []),
              ...(policyMode ? [policy("later")] : []),
            ]
          : []),
      ],
      onError(error) {
        throw error
      },
    }),
  )

  editor.setRootElement(root)

  return editor
}

const source = makeEditor("source", true, "blocks")

const updateTags = []

source.registerUpdateListener(({ tags, dirtyElements, dirtyLeaves }) => {
  if (dirtyElements.size > 0 || dirtyLeaves.size > 0)
    updateTags.push(Array.from(tags))
})

const same = makeEditor("same", true, "blocks")

const target = makeEditor("target", false, "other")

const editors = { source, same, target }

function load(id, html) {
  const editor = editors[id]
  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      root.append(
        ...$generateNodesFromDOM(
          editor,
          new DOMParser().parseFromString(html, "text/html"),
        ),
      )
      root.selectEnd()
    },
    { discrete: true },
  )
}

function payload() {
  return source.read(() => ({
    data: $getClipboardDataFromSelection(),
    selection: $getSelection()
      ?.getNodes()
      .map((node) => node.getKey()),
    json: source.getEditorState().toJSON(),
  }))
}

const clipboardEvents = []

for (const name of ["copy", "cut"])
  document.addEventListener(name, (event) => {
    if (!(event instanceof ClipboardEvent) || !event.clipboardData) return
    clipboardEvents.push({
      html: event.clipboardData.getData("text/html"),
      lexical: event.clipboardData.getData("application/x-lexical-editor"),
      plain: event.clipboardData.getData("text/plain"),
      extra: event.clipboardData.getData("application/x-host"),
    })
  })

function selectNode() {
  source.update(
    () => {
      const callout = $getRoot()
        .getChildren()
        .find((node) => node instanceof CalloutNode)

      if (!callout) throw new Error("Missing callout")
      const selection = $createNodeSelection()
      selection.add(callout.getKey())
      $setSelection(selection)
    },
    { discrete: true },
  )
}

Object.assign(window, {
  fixture: {
    source,
    load,
    payload,
    clipboardEvents,
    calls,
    updateTags,
    cutTag: CUT_TAG,
    cutCalls,
    registration,
    history,
    json: (id = "source") => editors[id].getEditorState().toJSON(),
    selectNode,
    state: () => state(source),
  },
})

load("source", "<p>Ready</p>")

load("same", "<p>Target keep</p>")

load("target", "<p>Target keep</p>")
