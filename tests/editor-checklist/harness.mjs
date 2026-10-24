import { createChecklistAccessibilityExtension } from "@editor/checklist-accessibility"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  CheckListExtension,
  ListExtension,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list"
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  TRANSFORMERS,
} from "@lexical/markdown"
import { RichTextExtension } from "@lexical/rich-text"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

const root = document.querySelector("[contenteditable]")

if (!(root instanceof HTMLElement)) throw new Error("Missing editor root")

const editor = buildEditorFromExtensions({
  name: "test/checklist",
  namespace: "checklist-native",
  dependencies: [
    RichTextExtension,
    HistoryExtension,
    ListExtension,
    CheckListExtension,
    createChecklistAccessibilityExtension("native-check"),
  ],
  onError(error) {
    throw error
  },
})

editor.setRootElement(root)

function reset(text = "") {
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode(text)))
      $getRoot().selectEnd()
    },
    { discrete: true },
  )
  editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
}

function snapshot() {
  return editor.getEditorState().read(() => ({
    json: editor.getEditorState().toJSON(),
    html: $generateHtmlFromNodes(editor),
    markdown: $convertToMarkdownString([CHECK_LIST, ...TRANSFORMERS]),
    text: $getRoot().getTextContent(),
  }))
}

function paste(html) {
  editor.update(
    () => {
      const nodes = $generateNodesFromDOM(
        editor,
        new DOMParser().parseFromString(html, "text/html"),
      )

      $getRoot()
        .clear()
        .append(...nodes)
      $getRoot().selectEnd()
    },
    { discrete: true },
  )
}

function detach() {
  editor.setRootElement(null)
}

function attach() {
  editor.setRootElement(root)
}

Object.assign(window, {
  checklist: {
    reset,
    selection() {
      return editor.getEditorState().read(() => {
        const selection = $getSelection()

        return $isRangeSelection(selection)
          ? {
              anchor: {
                key: selection.anchor.key,
                offset: selection.anchor.offset,
                type: selection.anchor.type,
              },
              focus: {
                key: selection.focus.key,
                offset: selection.focus.offset,
                type: selection.focus.type,
              },
            }
          : null
      })
    },
    snapshot,
    paste,
    markdown(value) {
      editor.update(() => $convertFromMarkdownString(value, [CHECK_LIST]), {
        discrete: true,
      })
    },
    json(value) {
      editor.setEditorState(editor.parseEditorState(JSON.stringify(value)))
    },
    detach,
    attach,
    editable(value) {
      editor.setEditable(value)
    },
    indent() {
      editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
    },
    outdent() {
      editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
    },
    undo() {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    },
    redo() {
      editor.dispatchCommand(REDO_COMMAND, undefined)
    },
    paragraph() {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    },
  },
})

reset()
