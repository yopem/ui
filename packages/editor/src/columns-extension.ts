import type {
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
} from "lexical"

import { $insertNodeToNearestRoot } from "@lexical/utils"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $addUpdateTag,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $getSlot,
  $getSlotHost,
  $getSlotNames,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $nodesOfType,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  HISTORY_PUSH_TAG,
  isCurrentlyReadOnlyMode,
  mergeRegister,
  RootNode,
} from "lexical"

import {
  EDITOR_COLUMNS_MAX_DEPTH,
  EDITOR_COLUMNS_MAX_NODES,
  moveEditorColumnsLayout,
  parseEditorColumnsLayout,
  resizeEditorColumnsLayout,
  validateEditorColumnsJSON,
  type EditorColumnsLayout,
} from "./columns-model"
import {
  $createEditorColumnNode,
  $createEditorColumnsGroupNode,
  EditorColumnNode,
  EditorColumnsGroupNode,
} from "./columns-node"

const styles = stylex.create({
  group: {
    display: "grid",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 640px)": "var(--editor-columns-template)",
    },
    marginBlock: `calc(${tokens["--spacing"]} * 2)`,
    minInlineSize: 0,
  },
  column: {
    borderColor: {
      default: "transparent",
      "[data-editor-column-editable]": tokens["--border"],
    },
    borderRadius: tokens["--radius-md"],
    borderStyle: "dashed",
    borderWidth: 1,
    minInlineSize: 0,
    padding: `calc(${tokens["--spacing"]} * 2)`,
  },
})

export const INSERT_EDITOR_COLUMNS_COMMAND = createCommand<readonly number[]>(
  "INSERT_EDITOR_COLUMNS_COMMAND",
)

export const SET_EDITOR_COLUMNS_LAYOUT_COMMAND = createCommand<
  readonly number[]
>("SET_EDITOR_COLUMNS_LAYOUT_COMMAND")

export const RESIZE_EDITOR_COLUMN_COMMAND = createCommand<{
  boundary: number
  width: number
}>("RESIZE_EDITOR_COLUMN_COMMAND")

export const MOVE_EDITOR_COLUMN_COMMAND = createCommand<"left" | "right">(
  "MOVE_EDITOR_COLUMN_COMMAND",
)

export const REMOVE_EDITOR_COLUMNS_COMMAND = createCommand<void>(
  "REMOVE_EDITOR_COLUMNS_COMMAND",
)

export const EDITOR_COLUMNS_ERROR_COMMAND = createCommand<Error>(
  "EDITOR_COLUMNS_ERROR_COMMAND",
)

export interface EditorColumnsContext {
  group: EditorColumnsGroupNode
  columnIndex: number | null
  layout: EditorColumnsLayout
}

class EditorColumnsError extends Error {}

export function $getEditorColumnsContext() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection) && !$isNodeSelection(selection)) return null

  const selectedNodes = $isRangeSelection(selection)
    ? [selection.anchor.getNode(), selection.focus.getNode()]
    : selection.getNodes()

  if (!selectedNodes.length) return null
  const contexts = selectedNodes.map(findColumnContext)
  const first = contexts[0]

  if (!first || contexts.some((context) => !context?.group.is(first.group)))
    return null

  const columnKeys = new Set(
    contexts.flatMap((context) =>
      context?.column ? [context.column.getKey()] : [],
    ),
  )

  const columnIndex =
    columnKeys.size === 1 && first.column
      ? first.group.getChildren().findIndex((node) => node.is(first.column))
      : null

  return {
    group: first.group,
    columnIndex: columnIndex === -1 ? null : columnIndex,
    layout: first.group.getLayout(),
  }
}

export function $insertEditorColumns(value: readonly number[]) {
  if (isCurrentlyReadOnlyMode()) return false
  let layout: EditorColumnsLayout

  try {
    layout = parseEditorColumnsLayout(value)
  } catch {
    return false
  }

  const selection = $getSelection()

  if (
    !$isRangeSelection(selection) ||
    !selection.isCollapsed() ||
    $getEditorColumnsContext() ||
    !$canInsertEditorColumns(selection.anchor.getNode())
  )
    return false

  const group = $createEditorColumnsGroupNode(layout)

  group.append(
    ...layout.map(() =>
      $createEditorColumnNode().append($createParagraphNode()),
    ),
  )

  $insertNodeToNearestRoot(group)
  const firstColumn = group.getFirstChild()

  if (!(firstColumn instanceof EditorColumnNode)) return false
  firstColumn.selectStart()

  return true
}

export function $setEditorColumnsLayout(value: readonly number[]) {
  if (isCurrentlyReadOnlyMode()) return false
  let layout: EditorColumnsLayout

  try {
    layout = parseEditorColumnsLayout(value)
  } catch {
    return false
  }

  const context = $getEditorColumnsContext()

  if (!context || context.group.getChildrenSize() !== layout.length)
    return false
  context.group.setLayout(layout)

  return true
}

export function $resizeEditorColumn(boundary: number, width: number) {
  if (isCurrentlyReadOnlyMode()) return false
  const context = $getEditorColumnsContext()

  if (!context) return false

  try {
    context.group.setLayout(
      resizeEditorColumnsLayout(context.group.getLayout(), boundary, width),
    )
  } catch {
    return false
  }

  return true
}

export function $moveEditorColumn(direction: "left" | "right") {
  if (
    isCurrentlyReadOnlyMode() ||
    (direction !== "left" && direction !== "right")
  )
    return false
  const context = $getEditorColumnsContext()

  if (!context || context.columnIndex === null) return false
  const from = context.columnIndex
  const to = from + (direction === "left" ? -1 : 1)
  const target = context.group.getChildAtIndex(to)

  if (!(target instanceof EditorColumnNode)) return false
  const selected = context.group.getChildAtIndex(from)

  if (!(selected instanceof EditorColumnNode)) return false

  if (to < from) selected.insertBefore(target)
  else selected.insertAfter(target)
  context.group.setLayout(moveEditorColumnsLayout(context.layout, from, to))

  return true
}

export function $removeEditorColumns() {
  if (isCurrentlyReadOnlyMode()) return false
  const context = $getEditorColumnsContext()

  if (
    !context ||
    $getSlotHost(context.group) ||
    $hasSlotsInColumns(context.group)
  )
    return false
  context.group.selectNext()
  context.group.remove()

  return true
}

export function registerEditorColumnsValidation(editor: LexicalEditor) {
  return editor.registerNodeTransform(RootNode, () => {
    if (
      $nodesOfType(EditorColumnsGroupNode).length === 0 &&
      $nodesOfType(EditorColumnNode).length === 0
    )
      return

    try {
      type SerializedNode = SerializedLexicalNode & {
        children?: SerializedNode[]
        $slots?: Record<string, SerializedNode>
      }

      interface SerializedRoot {
        value?: SerializedNode
      }

      const root: SerializedRoot = {}

      const pending: {
        node: LexicalNode
        depth: number
        assign: (value: SerializedNode) => void
      }[] = [
        {
          node: $getRoot(),
          depth: 0,
          assign: (value) => {
            root.value = value
          },
        },
      ]

      const visited = new Set<string>()

      while (pending.length) {
        const entry = pending.pop()

        if (!entry) break
        const { node, depth, assign } = entry
        const key = node.getKey()

        if (
          depth > EDITOR_COLUMNS_MAX_DEPTH ||
          visited.has(key) ||
          visited.size >= EDITOR_COLUMNS_MAX_NODES
        )
          throw new EditorColumnsError("Editor columns document exceeds limits")
        visited.add(key)
        const childCount = $isElementNode(node) ? node.getChildrenSize() : 0
        const names = $getSlotNames(node)

        if (
          visited.size + pending.length + childCount + names.length >
          EDITOR_COLUMNS_MAX_NODES
        )
          throw new EditorColumnsError("Editor columns document exceeds limits")
        const value: SerializedNode = { ...node.exportJSON() }

        if (value.type !== node.getType())
          throw new EditorColumnsError("Invalid node export")
        delete value.children
        delete value.$slots
        assign(value)

        if (names.length) {
          const slots: Record<string, SerializedNode> = Object.create(null)

          value.$slots = slots

          for (let index = names.length - 1; index >= 0; index -= 1) {
            const name = names[index]

            if (name === undefined)
              throw new EditorColumnsError("Invalid slot name")
            const child = $getSlot(node, name)

            if (!child) throw new EditorColumnsError("Missing slot value")
            pending.push({
              node: child,
              depth: depth + 1,
              assign: (item) => {
                slots[name] = item
              },
            })
          }
        }

        if ($isElementNode(node)) {
          const children = node.getChildren()
          const serialized: SerializedNode[] = []

          value.children = serialized

          for (let index = children.length - 1; index >= 0; index -= 1) {
            const child = children[index]

            if (!child) throw new EditorColumnsError("Missing child")
            pending.push({
              node: child,
              depth: depth + 1,
              assign: (item) => {
                serialized.push(item)
              },
            })
          }
        }
      }

      validateEditorColumnsJSON({ root: root.value })
    } catch {
      throw new EditorColumnsError("Invalid editor columns state")
    }
  })
}

export const EditorColumnsExtension = defineExtension({
  name: "@yopem-ui/editor/columns",
  nodes: [EditorColumnsGroupNode, EditorColumnNode],
  init(editorConfig) {
    const previousError = editorConfig.onError

    editorConfig.onError = (error, editor) => {
      if (error instanceof EditorColumnsError) {
        queueMicrotask(() => {
          editor.dispatchCommand(EDITOR_COLUMNS_ERROR_COMMAND, error)
        })

        return
      }

      if (previousError) previousError(error, editor)
      else throw error
    }
  },
  register(editor) {
    function setClass(element: HTMLElement, className: string) {
      const classes = className.split(" ").filter(Boolean)

      if (classes.length) element.classList.add(...classes)
    }

    function updateGroup(key: string) {
      const group = editor.getEditorState().read(() => $getNodeByKey(key))
      const element = editor.getElementByKey(key)

      if (!(group instanceof EditorColumnsGroupNode) || !element) return
      setClass(element, stylex.props(styles.group).className ?? "")
    }

    function updateColumn(key: string, editable = editor.isEditable()) {
      const column = editor.getEditorState().read(() => $getNodeByKey(key))
      const element = editor.getElementByKey(key)

      if (!(column instanceof EditorColumnNode) || !element) return
      setClass(element, stylex.props(styles.column).className ?? "")
      element.toggleAttribute("data-editor-column-editable", editable)
    }

    function updateNodes(editable = editor.isEditable()) {
      const keys = editor.getEditorState().read(() => ({
        groups: $nodesOfType(EditorColumnsGroupNode).map((group) =>
          group.getKey(),
        ),
        columns: $nodesOfType(EditorColumnNode).map((column) =>
          column.getKey(),
        ),
      }))

      for (const key of keys.groups) updateGroup(key)

      for (const key of keys.columns) updateColumn(key, editable)
    }

    function registerCommand<TPayload>(
      command: LexicalCommand<TPayload>,
      action: (payload: TPayload) => boolean,
    ) {
      return editor.registerCommand(
        command,
        (payload) => {
          if (!editor.isEditable() || isCurrentlyReadOnlyMode()) return false

          return action(payload)
        },
        COMMAND_PRIORITY_EDITOR,
      )
    }

    return mergeRegister(
      editor.registerRootListener((root) => {
        if (root) updateNodes()
      }),
      editor.registerEditableListener((editable) => updateNodes(editable)),
      editor.registerMutationListener(EditorColumnsGroupNode, (mutations) => {
        for (const [key, mutation] of mutations)
          if (mutation !== "destroyed") updateGroup(key)
      }),
      editor.registerMutationListener(EditorColumnNode, (mutations) => {
        for (const [key, mutation] of mutations)
          if (mutation !== "destroyed") updateColumn(key)
      }),
      editor.registerNodeTransform(EditorColumnNode, (column) => {
        if (column.getChildrenSize() === 0)
          column.append($createParagraphNode())
      }),
      registerEditorColumnsValidation(editor),
      registerCommand(INSERT_EDITOR_COLUMNS_COMMAND, (layout) => {
        $addUpdateTag(HISTORY_PUSH_TAG)

        return $insertEditorColumns(layout)
      }),
      registerCommand(SET_EDITOR_COLUMNS_LAYOUT_COMMAND, (layout) => {
        $addUpdateTag(HISTORY_PUSH_TAG)

        return $setEditorColumnsLayout(layout)
      }),
      registerCommand(RESIZE_EDITOR_COLUMN_COMMAND, ({ boundary, width }) => {
        $addUpdateTag(HISTORY_PUSH_TAG)

        return $resizeEditorColumn(boundary, width)
      }),
      registerCommand(MOVE_EDITOR_COLUMN_COMMAND, (direction) => {
        $addUpdateTag(HISTORY_PUSH_TAG)

        return $moveEditorColumn(direction)
      }),
      registerCommand(REMOVE_EDITOR_COLUMNS_COMMAND, () => {
        $addUpdateTag(HISTORY_PUSH_TAG)

        return $removeEditorColumns()
      }),
    )
  },
})

function $canInsertEditorColumns(node: LexicalNode) {
  const visited = new Set<string>()
  let current: LexicalNode | null = node

  while (current) {
    const key = current.getKey()

    if (visited.has(key) || visited.size > EDITOR_COLUMNS_MAX_DEPTH)
      return false
    visited.add(key)

    if ($getSlotHost(current)) return false

    if (!(current instanceof RootNode) && $getSlotNames(current).length)
      return false
    current = current.getParent()
  }

  return true
}

function $hasSlotsInColumns(group: EditorColumnsGroupNode) {
  const pending: LexicalNode[] = [group]
  const visited = new Set<string>()

  while (pending.length) {
    const node = pending.pop()

    if (
      !node ||
      visited.has(node.getKey()) ||
      visited.size >= EDITOR_COLUMNS_MAX_NODES
    )
      return true
    visited.add(node.getKey())

    if ($getSlotNames(node).length) return true

    if ($isElementNode(node)) {
      if (
        visited.size + pending.length + node.getChildrenSize() >
        EDITOR_COLUMNS_MAX_NODES
      )
        return true
      pending.push(...node.getChildren())
    }
  }

  return false
}

function findColumnContext(node: LexicalNode) {
  let current: LexicalNode | null = node
  let column: EditorColumnNode | null = null

  while (current && !(current instanceof EditorColumnsGroupNode)) {
    if (current instanceof EditorColumnNode) column = current
    current = current.getParent()
  }

  if (!(current instanceof EditorColumnsGroupNode)) return null

  return { group: current, column }
}
