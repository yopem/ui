import type {
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditorState,
} from "lexical"

import { $createCodeNode } from "@lexical/code"
import { $removeList } from "@lexical/list"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  defineExtension,
  FORMAT_ELEMENT_COMMAND,
  HISTORY_PUSH_TAG,
  INDENT_CONTENT_COMMAND,
  mergeRegister,
  OUTDENT_CONTENT_COMMAND,
} from "lexical"

import { createEditorBlockSelection } from "./block-selection"
import { createEditorSelectionBookmark } from "./selection-bookmark"

export type EditorBlockMenuAction =
  | "copy"
  | "duplicate"
  | "delete"
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "heading-5"
  | "heading-6"
  | "quote"
  | "code"
  | "indent"
  | "outdent"
  | "align-left"
  | "align-center"
  | "align-right"
  | "align-justify"
  | "ask-ai"
  | "code-drawing"

export interface EditorBlockMenuContext {
  readonly blockKey: NodeKey
  readonly blockText: string
  readonly selectedText: string
}

export interface EditorBlockMenuOptions {
  validateDocument?: (state: SerializedEditorState) => boolean
  authorizeAction?: (
    action: EditorBlockMenuAction,
    context: EditorBlockMenuContext,
  ) => boolean
  onAskAI?: (context: EditorBlockMenuContext) => void
  onCodeDrawing?: (context: EditorBlockMenuContext) => void
}

export interface EditorBlockMenuSnapshot {
  readonly open: boolean
  readonly editable: boolean
  readonly target: EditorBlockMenuContext | null
  readonly canTransform: boolean
  readonly canAskAI: boolean
  readonly canCodeDrawing: boolean
}

interface TargetRecord {
  readonly context: EditorBlockMenuContext
  readonly revision: number
  readonly index: number
}

const editableActions = new Set<EditorBlockMenuAction>([
  "duplicate",
  "delete",
  "paragraph",
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
  "heading-5",
  "heading-6",
  "quote",
  "code",
  "indent",
  "outdent",
  "align-left",
  "align-center",
  "align-right",
  "align-justify",
])

const transformableBlocks = new Set([
  "paragraph",
  "heading",
  "quote",
  "code",
  "list",
])

function $getTopLevelBlock(node: LexicalNode | null) {
  if (!node) return null
  const root = $getRoot()
  let current = node

  while (current.getParent() && current.getParent() !== root) {
    const parent = current.getParent()

    if (!parent) return null
    current = parent
  }

  return current.getParent() === root ? current : null
}

function $getSelectedNode() {
  const selection = $getSelection()

  if ($isRangeSelection(selection)) return selection.anchor.getNode()

  if ($isNodeSelection(selection)) return selection.getNodes()[0] ?? null

  return null
}

function $selectionTargetsBlock(blockKey: NodeKey) {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return false

  const nodes = [
    selection.anchor.getNode(),
    selection.focus.getNode(),
    ...selection.getNodes(),
  ]

  return nodes.every((node) => $getTopLevelBlock(node)?.getKey() === blockKey)
}

export function createEditorBlockMenu(options: EditorBlockMenuOptions = {}) {
  const blockSelection = createEditorBlockSelection(
    options.validateDocument
      ? { validateDocument: options.validateDocument }
      : {},
  )

  const listeners = new Set<() => void>()

  const serverSnapshot: EditorBlockMenuSnapshot = {
    open: false,
    editable: false,
    target: null,
    canTransform: false,
    canAskAI: options.onAskAI !== undefined,
    canCodeDrawing: options.onCodeDrawing !== undefined,
  }

  let snapshot = serverSnapshot
  let editor: LexicalEditor | null = null
  let bookmark: ReturnType<typeof createEditorSelectionBookmark> | null = null
  let unsubscribeBookmark: (() => void) | undefined
  let target: TargetRecord | null = null
  let revision = 0

  function publish(next: EditorBlockMenuSnapshot) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  function clearTarget() {
    target = null
    publish({
      ...snapshot,
      open: false,
      target: null,
      canTransform: false,
    })
  }

  function capture(targetNode: EventTarget | null, fromSelection: boolean) {
    const currentEditor = editor

    if (!currentEditor || !bookmark) return false

    const nodeConstructor =
      currentEditor.getRootElement()?.ownerDocument.defaultView?.Node

    const captured = currentEditor.getEditorState().read(() => {
      const lexicalNode = fromSelection
        ? $getSelectedNode()
        : nodeConstructor && targetNode instanceof nodeConstructor
          ? $getNearestNodeFromDOMNode(targetNode)
          : null

      const block = $getTopLevelBlock(lexicalNode)

      if (!block) return null

      const children = $getRoot().getChildren()

      const index = children.findIndex(
        (child) => child.getKey() === block.getKey(),
      )

      if (index < 0) return null

      const selection = $getSelection()

      const selectedText =
        $isRangeSelection(selection) && !selection.isCollapsed()
          ? selection.getTextContent()
          : ""

      bookmark?.capture()

      return {
        record: {
          context: Object.freeze({
            blockKey: block.getKey(),
            blockText: block.getTextContent(),
            selectedText,
          }),
          revision,
          index,
        },
        canTransform: transformableBlocks.has(block.getType()),
      }
    })

    if (!captured) {
      bookmark.clear()
      clearTarget()

      return false
    }

    target = captured.record
    publish({
      ...snapshot,
      open: true,
      target: captured.record.context,
      canTransform: captured.canTransform,
    })

    return true
  }

  function currentTarget(record: TargetRecord) {
    const currentEditor = editor

    if (!currentEditor || target !== record || record.revision !== revision)
      return null

    return currentEditor.read("pending", () => {
      if ($getRoot().isDirty()) return null
      const block = $getNodeByKey(record.context.blockKey)

      if (block?.getParent() !== $getRoot()) return null

      return block
    })
  }

  function approved(action: EditorBlockMenuAction, record: TargetRecord) {
    if (target !== record || !currentTarget(record)) return false

    if (editableActions.has(action) && !editor?.isEditable()) return false

    if (options.authorizeAction) {
      try {
        if (options.authorizeAction(action, record.context) !== true)
          return false
      } catch {
        return false
      }
    }

    return target === record && currentTarget(record) !== null
  }

  function restoreSelection() {
    const currentEditor = editor

    if (!currentEditor || !bookmark) return false
    let restored = false

    currentEditor.update(
      () => {
        restored = bookmark?.restore() ?? false
      },
      { discrete: true },
    )

    return restored
  }

  function moveCaret(record: TargetRecord, duplicated: boolean) {
    const currentEditor = editor

    if (!currentEditor) return

    const keys = currentEditor
      .getEditorState()
      .read(() => $getRoot().getChildrenKeys())

    const index = duplicated
      ? Math.min(record.index + 1, keys.length - 1)
      : Math.min(record.index, keys.length - 1)

    const key = keys[index]

    if (!key) return
    currentEditor.update(
      () => {
        const block = $getNodeByKey(key)

        if ($isElementNode(block)) block.selectStart()
      },
      { discrete: true },
    )
  }

  function mutateBlock(action: EditorBlockMenuAction, record: TargetRecord) {
    const currentEditor = editor

    if (!currentEditor || !approved(action, record)) return false
    let applied = false

    currentEditor.update(
      () => {
        if (!currentTarget(record)) return
        const block = $getNodeByKey(record.context.blockKey)

        if (!$isElementNode(block) || !transformableBlocks.has(block.getType()))
          return
        const restored = bookmark?.restore() === true

        if (!restored || !$selectionTargetsBlock(block.getKey()))
          block.selectStart()
        let selection = $getSelection()

        if (!$isRangeSelection(selection)) return

        if (
          action === "paragraph" ||
          action.startsWith("heading-") ||
          action === "quote" ||
          action === "code"
        ) {
          $removeList()
          selection = $getSelection()

          if (!$isRangeSelection(selection)) return
          $setBlocksType(selection, () => {
            if (action === "paragraph") return $createParagraphNode()

            if (action === "quote") return $createQuoteNode()

            if (action === "code") return $createCodeNode()

            switch (action) {
              case "heading-1":
                return $createHeadingNode("h1")
              case "heading-2":
                return $createHeadingNode("h2")
              case "heading-3":
                return $createHeadingNode("h3")
              case "heading-4":
                return $createHeadingNode("h4")
              case "heading-5":
                return $createHeadingNode("h5")
              case "heading-6":
                return $createHeadingNode("h6")
              default:
                return $createParagraphNode()
            }
          })
        } else if (action === "indent" || action === "outdent") {
          currentEditor.dispatchCommand(
            action === "indent"
              ? INDENT_CONTENT_COMMAND
              : OUTDENT_CONTENT_COMMAND,
            undefined,
          )
        } else {
          const alignment = action.slice("align-".length)

          if (
            alignment === "left" ||
            alignment === "center" ||
            alignment === "right" ||
            alignment === "justify"
          )
            currentEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
          else return
        }

        applied = true
      },
      { tag: HISTORY_PUSH_TAG },
    )

    return applied
  }

  async function run(action: EditorBlockMenuAction) {
    const record = target

    if (!record || !approved(action, record)) return false
    const currentEditor = editor

    if (!currentEditor) return false

    if (action === "ask-ai") {
      if (!options.onAskAI) return false

      try {
        options.onAskAI(record.context)

        return true
      } catch {
        return false
      }
    }

    if (action === "code-drawing") {
      if (!options.onCodeDrawing) return false

      try {
        options.onCodeDrawing(record.context)

        return true
      } catch {
        return false
      }
    }

    if (action === "duplicate" || action === "delete" || action === "copy") {
      if (!blockSelection.select(record.context.blockKey)) return false

      if (action === "copy") {
        const copied = blockSelection.copy()
        blockSelection.clear()

        if (target === record && revision === record.revision)
          restoreSelection()

        const result = await copied

        return result
      }

      const changed =
        action === "duplicate"
          ? blockSelection.duplicate()
          : blockSelection.remove()

      blockSelection.clear()

      if (changed) moveCaret(record, action === "duplicate")
      else if (target === record && revision === record.revision)
        restoreSelection()

      return changed
    }

    return mutateBlock(action, record)
  }

  const extension = defineExtension({
    name: "@yopem-ui/editor/block-menu",
    dependencies: [blockSelection.extension],
    register(currentEditor) {
      if (editor) throw new Error("Use one block menu per editor root")
      editor = currentEditor
      bookmark = createEditorSelectionBookmark(currentEditor)
      unsubscribeBookmark = bookmark.subscribe(() => undefined)
      publish({ ...snapshot, editable: currentEditor.isEditable() })

      return mergeRegister(
        currentEditor.registerUpdateListener(
          ({ dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
            revision += 1
            bookmark?.clear()
            clearTarget()
          },
        ),
        currentEditor.registerEditableListener((editable) => {
          publish({ ...snapshot, editable })
        }),
        () => {
          unsubscribeBookmark?.()
          unsubscribeBookmark = undefined
          bookmark = null
          editor = null
          target = null
          revision += 1
          publish({
            ...serverSnapshot,
            canAskAI: options.onAskAI !== undefined,
            canCodeDrawing: options.onCodeDrawing !== undefined,
          })
        },
      )
    },
  })

  return {
    extension,
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return serverSnapshot
    },
    captureFromTarget(targetNode: EventTarget | null) {
      return capture(targetNode, false)
    },
    captureFromSelection() {
      return capture(null, true)
    },
    close() {
      restoreSelection()
      bookmark?.clear()
      clearTarget()
    },
    run,
  }
}

export type EditorBlockMenuController = ReturnType<typeof createEditorBlockMenu>
