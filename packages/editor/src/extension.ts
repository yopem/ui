import type { StackProps } from "@registry/components/ui/stack"
import type {
  AnyLexicalExtensionArgument,
  EditorState,
  LexicalEditor,
  NodeKey,
  SerializedEditorState,
  TextFormatType,
} from "lexical"

import { CodeExtension } from "@lexical/code"
import { HistoryExtension } from "@lexical/history"
import { LinkExtension, LinkNode } from "@lexical/link"
import { CheckListExtension, ListExtension } from "@lexical/list"
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown"
import { RichTextExtension } from "@lexical/rich-text"
import { TableExtension, TableNode } from "@lexical/table"
import * as stylex from "@stylexjs/stylex"
import {
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  configExtension,
  defineExtension,
  mergeRegister,
} from "lexical"

import { createChecklistAccessibilityExtension } from "./checklist-accessibility"
import { editorStyles, editorTheme } from "./theme"

export interface EditorProps extends Omit<StackProps, "children" | "onChange"> {
  extensions?: readonly AnyLexicalExtensionArgument[]
  initialState?: SerializedEditorState | string
  onChange?: (state: EditorState, editor: LexicalEditor) => void
  editable?: boolean
  ariaLabel?: string
  placeholder?: string
}

export interface EditorStateSnapshot {
  readonly ariaLabel: string
  readonly editable: boolean
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly formats: readonly TextFormatType[]
}

const formats: TextFormatType[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "subscript",
  "superscript",
  "highlight",
  "lowercase",
  "uppercase",
  "capitalize",
]

export function isSafeLink(url: string) {
  try {
    const parsed = new URL(url)

    return ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function createEditorSetup({
  initialState,
  editable = true,
  ariaLabel = "Rich text editor",
  extensions = [],
}: EditorProps) {
  const listeners = new Set<() => void>()

  let snapshot: EditorStateSnapshot = {
    ariaLabel,
    editable,
    canUndo: false,
    canRedo: false,
    formats: [],
  }

  let onChange: EditorProps["onChange"]
  let editor: LexicalEditor | undefined
  let currentEditable = editable

  function publish(next: typeof snapshot) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  const extension = defineExtension({
    name: "@yopem-ui/editor",
    namespace: "yopem-ui-editor",
    editable: false,
    $initialEditorState:
      initialState instanceof Object
        ? JSON.stringify(initialState)
        : initialState,
    theme: editorTheme,
    onError(error) {
      throw error
    },
    dependencies: [
      RichTextExtension,
      HistoryExtension,
      ListExtension,
      CheckListExtension,
      createChecklistAccessibilityExtension(
        stylex.props(editorStyles.checkControl).className ?? "",
      ),
      configExtension(LinkExtension, { validateUrl: isSafeLink }),
      CodeExtension,
      TableExtension,
      ...extensions,
    ],
    register(instance) {
      editor = instance

      function configureTableViewport(key: NodeKey) {
        const element = instance.getElementByKey(key)

        if (!element || element.matches("table")) return
        element.tabIndex = 0
        element.setAttribute("role", "group")
        element.setAttribute("aria-label", "Table content")
        element.setAttribute("data-slot", "editor-table-scroll")
      }

      return mergeRegister(
        instance.registerRootListener((root) => {
          instance.setEditable(root !== null && currentEditable)

          if (root)
            instance.getEditorState().read(() => {
              for (const table of $nodesOfType(TableNode))
                configureTableViewport(table.getKey())
            })
        }),
        instance.registerMutationListener(TableNode, (mutations) => {
          for (const [key, mutation] of mutations) {
            if (mutation !== "destroyed") configureTableViewport(key)
          }
        }),
        registerMarkdownShortcuts(instance, TRANSFORMERS),
        instance.registerNodeTransform(LinkNode, (node) => {
          if (!isSafeLink(node.getURL())) {
            for (const child of node.getChildren()) node.insertBefore(child)
            node.remove()
          }
        }),
        instance.registerCommand(
          CAN_UNDO_COMMAND,
          (canUndo) => {
            publish({ ...snapshot, canUndo })

            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        instance.registerCommand(
          CAN_REDO_COMMAND,
          (canRedo) => {
            publish({ ...snapshot, canRedo })

            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        instance.registerUpdateListener(
          ({ editorState, dirtyElements, dirtyLeaves }) => {
            const active = editorState.read(() => {
              const selection = $getSelection()

              return $isRangeSelection(selection)
                ? formats.filter((format) => selection.hasFormat(format))
                : []
            })

            publish({ ...snapshot, formats: active })

            if (dirtyElements.size > 0 || dirtyLeaves.size > 0)
              onChange?.(editorState, instance)
          },
        ),
        () => {
          editor = undefined
        },
      )
    },
  })

  return {
    extension,
    getSnapshot(this: void) {
      return snapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    connect(
      callback: EditorProps["onChange"],
      isEditable: boolean,
      label: string,
    ) {
      onChange = callback
      currentEditable = isEditable

      if (snapshot.editable !== isEditable || snapshot.ariaLabel !== label)
        publish({ ...snapshot, editable: isEditable, ariaLabel: label })

      if (editor?.getRootElement()) editor.setEditable(isEditable)

      return () => {
        onChange = undefined
      }
    },
  }
}
