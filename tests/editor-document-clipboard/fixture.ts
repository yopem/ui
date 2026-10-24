import { EditorCalloutClipboardExtension } from "@editor/blocks-clipboard"
import { codeWrapState, codeLineNumbersState } from "@editor/code-model"
import * as documentAPI from "@editor/document/index"
import {
  documentNodes,
  registerDocumentPaste,
  importDocument,
} from "@editor/document/index"
import {
  ClipboardImportExtension,
  DEFAULT_IMPORT_MIME_TYPE,
  $insertDataTransferForRichText,
} from "@lexical/clipboard"
import { $createCodeNode, $createCodeHighlightNode } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { registerHistory, createEmptyHistoryState } from "@lexical/history"
import { registerRichText } from "@lexical/rich-text"
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $setState,
  $getSelection,
  $isTextNode,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
  $createNodeSelection,
  $setSelection,
} from "lexical"
import { defineExtension, configExtension, createState } from "lexical"

const errors: string[] = []

const mimeCalls: string[] = []

const clipboardMetadataState = createState("customClipboardState", {
  parse(value) {
    return value === "kept" ? "kept" : ""
  },
})

const params = new URLSearchParams(location.search)

const mode = params.get("mode")

const policyMime = params.has("json-policy")
  ? "application/x-lexical-editor"
  : params.get("mime") === "plain"
    ? "text/plain"
    : params.get("mime") === "uri"
      ? "text/uri-list"
      : "text/html"

const host = defineExtension({
  name: "clipboard-host-policy",
  dependencies: [
    configExtension(ClipboardImportExtension, {
      priority: params.has("html-first") ? { "text/html": -1 } : {},
      $importMimeType: {
        [policyMime]: [
          function clipboardAction(_data, selection, next, transfer) {
            if (!mode) return next()
            mimeCalls.push(mode)

            if (mode === "veto") return true

            if (mode === "redact") {
              const importer = DEFAULT_IMPORT_MIME_TYPE[policyMime]?.[0]

              const redacted =
                policyMime === "text/html"
                  ? "<p>Redacted</p>"
                  : policyMime === "text/plain"
                    ? "Redacted"
                    : policyMime === "text/uri-list"
                      ? "https://example.com/Redacted"
                      : JSON.stringify({
                          namespace: "clipboard-probe",
                          nodes: [
                            {
                              type: "paragraph",
                              version: 1,
                              children: [
                                {
                                  type: "text",
                                  version: 1,
                                  text: "Redacted",
                                  format: 0,
                                  detail: 0,
                                  mode: "normal",
                                  style: "",
                                },
                              ],
                              direction: null,
                              format: "",
                              indent: 0,
                              textFormat: 0,
                              textStyle: "",
                            },
                          ],
                        })

              return importer
                ? importer(redacted, selection, () => false, transfer)
                : false
            }

            return next()
          },
        ],
      },
    }),
  ],
})

const editors = ["source", "native", "helper"].map(
  function clipboardAction(id) {
    const root = document.createElement("div")
    root.id = id
    root.contentEditable = "true"
    root.setAttribute("role", "textbox")
    root.setAttribute("aria-label", id)
    document.body.append(root)

    const boundary =
      "EditorDocumentClipboardExtension" in documentAPI
        ? [documentAPI.EditorDocumentClipboardExtension]
        : []

    const editor = buildEditorFromExtensions(
      defineExtension({
        name: id,
        namespace:
          id !== "source" && params.has("cross")
            ? "other-schema"
            : "clipboard-probe",
        nodes:
          id === "helper" && params.has("missing")
            ? documentNodes.filter((node) => node.getType() !== "code")
            : documentNodes,
        dependencies: [
          EditorCalloutClipboardExtension,
          ...(id === "helper"
            ? params.get("order") === "after"
              ? [...boundary, host]
              : [host, ...boundary]
            : []),
        ],
        onError(error) {
          errors.push(error.message)
        },
      }),
    )

    editor.setRootElement(root)
    registerRichText(editor)
    registerHistory(editor, createEmptyHistoryState(), 300)
    editor.update(
      function clipboardAction() {
        $getRoot().clear().append($createParagraphNode())
      },
      { discrete: true },
    )

    return editor
  },
)

const [source, native, helper] = editors

if (!source || !native || !helper) throw new Error("Missing editor")

let cleanup: (() => void) | undefined = registerDocumentPaste(
  helper,
  function clipboardAction(error) {
    errors.push(error.message)
  },
)

const copies: Record<string, string>[] = []

const copyContext: {
  prevented: boolean
  anchor: string | undefined
  selection: string | undefined
  constructors: string[] | undefined
}[] = []

document.addEventListener("copy", function clipboardAction(event) {
  const data = event.clipboardData
  copyContext.push({
    prevented: event.defaultPrevented,
    anchor: document
      .getSelection()
      ?.anchorNode?.parentElement?.closest("[contenteditable]")?.id,
    selection: source
      .getEditorState()
      .read(() => $getSelection()?.constructor.name),
    constructors: source.getEditorState().read(() =>
      $getSelection()
        ?.getNodes()
        .map((node) => node.constructor.name),
    ),
  })

  if (data)
    copies.push(
      Object.fromEntries(
        Array.from(data.types).map(function clipboardAction(type) {
          return [type, data.getData(type)]
        }),
      ),
    )
})

function setup(kind: string) {
  errors.length = 0

  if (kind === "code" || kind === "code-highlight")
    source.update(
      function clipboardAction() {
        const node = $createCodeNode("javascript").append(
          kind === "code-highlight"
            ? $createCodeHighlightNode("const answer = 42", "keyword")
            : $createTextNode("const answer = 42"),
        )

        $setState(node, codeWrapState, false)
        $setState(node, codeLineNumbersState, true)
        $getRoot().clear().append(node)
        node.select(0, node.getChildrenSize())
      },
      { discrete: true },
    )
  else {
    importDocument(
      source,
      kind === "metadata" ? "<p>Metadata</p>" : kind,
      "html",
    )

    if (kind === "metadata")
      source.update(
        function clipboardAction() {
          $setState(
            $getRoot().getFirstChildOrThrow(),
            clipboardMetadataState,
            "kept",
          )
        },
        { discrete: true },
      )
  }
}

function states() {
  return {
    editors: editors.map(function clipboardAction(editor) {
      return editor.getEditorState().toJSON()
    }),
    errors: [...errors],
    mimeCalls: [...mimeCalls],
    copies,
    copyContext,
  }
}

function selectAll() {
  const root = source.getRootElement()

  if (!root) throw new Error("Missing source root")
  root.focus()
  const range = document.createRange()
  range.selectNodeContents(root)
  const domSelection = document.getSelection()
  domSelection?.removeAllRanges()
  domSelection?.addRange(range)
  source.update(
    function clipboardAction() {
      const selection = $createNodeSelection()

      for (const node of $getRoot().getChildren()) selection.add(node.getKey())
      $setSelection(selection)
    },
    { discrete: true },
  )
}

function unregister() {
  cleanup?.()
  cleanup = undefined
}

function reconnect() {
  const previous = cleanup
  previous?.()
  cleanup = registerDocumentPaste(helper, function reportError(error) {
    errors.push(error.message)
  })
  previous?.()
}

function veto(priority: string, order: string) {
  if (order === "before") unregister()
  helper.registerCommand(
    PASTE_COMMAND,
    function clipboardAction(event) {
      event?.preventDefault()
      errors.push("host-veto")

      return true
    },
    priority === "critical" ? COMMAND_PRIORITY_CRITICAL : COMMAND_PRIORITY_HIGH,
  )

  if (order === "before")
    cleanup = registerDocumentPaste(helper, function clipboardAction(error) {
      errors.push(error.message)
    })
}

function pastePayload(payload: Record<string, string>, direct = false) {
  const data = new DataTransfer()

  for (const [type, value] of Object.entries(payload)) data.setData(type, value)

  if (direct) {
    helper.update(
      () => {
        const selection = $getSelection()

        if (selection) $insertDataTransferForRichText(data, selection)
      },
      { discrete: true },
    )

    return
  }

  helper.getRootElement()?.dispatchEvent(
    new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: data,
    }),
  )
}

function cancel() {
  helper.registerCommand(
    PASTE_COMMAND,
    (event) => {
      event?.preventDefault()

      return false
    },
    COMMAND_PRIORITY_HIGH,
  )
}

function readonly() {
  helper.setEditable(false)
}

function seedTarget() {
  for (const editor of [native, helper]) {
    importDocument(editor, "<p>Keep original</p>", "html")
    editor.update(
      function clipboardAction() {
        $getRoot().selectEnd()
      },
      { discrete: true },
    )
  }
}

function textSelection() {
  source.update(
    function clipboardAction() {
      const first = $getRoot().getFirstDescendant()

      if ($isTextNode(first)) first.select(1, 4)
    },
    { discrete: true },
  )
}

function tailSelection() {
  source.update(
    () => {
      const last = $getRoot().getLastDescendant()

      if ($isTextNode(last)) last.select(1, 4)
    },
    { discrete: true },
  )
}

Object.assign(window, {
  probe: {
    setup,
    states,
    selectAll,
    unregister,
    reconnect,
    veto,
    pastePayload,
    readonly,
    cancel,
    seedTarget,
    textSelection,
    tailSelection,
  },
})
