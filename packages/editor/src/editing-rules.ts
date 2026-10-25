import {
  $addUpdateTag,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  defineExtension,
  HISTORY_PUSH_TAG,
  PASTE_TAG,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_DOWN_COMMAND,
  mergeRegister,
  PASTE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type ParagraphNode,
  type RangeSelection,
} from "lexical"

export const EDITOR_EDITING_RULE_TEXT_LIMIT = 1048576

export const EDITOR_EDITING_RULE_LINE_LIMIT = 2501

export type EditorExitBreakDirection = "before" | "after"

export type EditorSingleBlockMode = "off" | "single-block" | "single-line"

export interface EditorEditingRulesOptions {
  singleBlockMode?: EditorSingleBlockMode
}

export type EditorExitBreakKeyEvent = Pick<
  KeyboardEvent,
  | "altKey"
  | "ctrlKey"
  | "defaultPrevented"
  | "isComposing"
  | "key"
  | "keyCode"
  | "metaKey"
  | "shiftKey"
>

export const INSERT_EDITOR_EXIT_BREAK_COMMAND =
  createCommand<EditorExitBreakDirection>("@yopem-ui/editor/insert-exit-break")

export const INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND = createCommand<string>(
  "@yopem-ui/editor/insert-single-block-text",
)

export const SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND =
  createCommand<EditorSingleBlockMode>("@yopem-ui/editor/set-single-block-mode")

export function getEditorExitBreakDirection(
  event: EditorExitBreakKeyEvent,
): EditorExitBreakDirection | null {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229 ||
    event.key !== "Enter" ||
    (!event.ctrlKey && !event.metaKey) ||
    event.altKey
  )
    return null

  return event.shiftKey ? "before" : "after"
}

function insertExitBreak(direction: EditorExitBreakDirection) {
  const selection = $getSelection()

  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false

  const root = $getRoot()
  let block = selection.anchor.getNode().getTopLevelElement()

  while (block) {
    const parent = block.getParent()

    if (parent === root) break

    block = parent
  }

  if (!block || block.getParent() !== root) return false

  $addUpdateTag(HISTORY_PUSH_TAG)
  const paragraph = $createParagraphNode()

  if (direction === "before") block.insertBefore(paragraph)
  else block.insertAfter(paragraph)

  paragraph.selectStart()

  return true
}

function getSingleParagraphRoot() {
  const children = $getRoot().getChildren()

  if (children.length !== 1 || !$isParagraphNode(children[0])) return null

  return children[0]
}

function getSingleParagraphSelection(paragraph: ParagraphNode) {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return null

  if (selection.anchor.getNode().getTopLevelElement() !== paragraph) return null

  if (selection.focus.getNode().getTopLevelElement() !== paragraph) return null

  return selection
}

function insertSingleBlockText(
  text: string,
  mode: Exclude<EditorSingleBlockMode, "off">,
  selection: RangeSelection,
) {
  if (
    text.length > EDITOR_EDITING_RULE_TEXT_LIMIT ||
    new TextEncoder().encode(text).byteLength > EDITOR_EDITING_RULE_TEXT_LIMIT
  )
    return

  const normalized = text.replace(/\r\n?/g, "\n")

  const value =
    mode === "single-line" ? normalized.replace(/\n/g, "") : normalized

  if (value.length === 0) return
  const lines = value.split("\n", EDITOR_EDITING_RULE_LINE_LIMIT + 1)

  if (lines.length > EDITOR_EDITING_RULE_LINE_LIMIT) return
  const nodes: LexicalNode[] = []

  for (const [index, line] of lines.entries()) {
    if (line.length > 0)
      nodes.push(
        $createTextNode(line)
          .setFormat(selection.format)
          .setStyle(selection.style),
      )

    if (index < lines.length - 1) nodes.push($createLineBreakNode())
  }

  selection.insertNodes(nodes)
  $addUpdateTag(HISTORY_PUSH_TAG)
}

function getTransfer(event: ClipboardEvent | InputEvent | KeyboardEvent) {
  if ("clipboardData" in event) return event.clipboardData

  if ("dataTransfer" in event) return event.dataTransfer

  return null
}

export function createEditorEditingRulesExtension(
  options: EditorEditingRulesOptions = {},
) {
  return defineExtension({
    name: "@yopem-ui/editor/editing-rules",
    register(editor: LexicalEditor) {
      let singleBlockMode = options.singleBlockMode ?? "off"

      function handleExitBreakKey(event: KeyboardEvent) {
        const direction = getEditorExitBreakDirection(event)

        if (!direction || editor.isComposing() || !editor.isEditable())
          return false

        if (singleBlockMode !== "off" && getSingleParagraphRoot()) {
          const handled = editor.dispatchCommand(
            INSERT_PARAGRAPH_COMMAND,
            undefined,
          )

          if (handled) event.preventDefault()

          return handled
        }

        if (
          !editor.dispatchCommand(INSERT_EDITOR_EXIT_BREAK_COMMAND, direction)
        )
          return false

        event.preventDefault()

        return true
      }

      function handleSingleBlockText(text: string) {
        if (singleBlockMode === "off") return false

        if (editor.isComposing()) return false

        if (!editor.isEditable()) return true

        const paragraph = getSingleParagraphRoot()

        if (!paragraph) return false

        const selection = getSingleParagraphSelection(paragraph)

        if (!selection) return true

        insertSingleBlockText(text, singleBlockMode, selection)

        return true
      }

      function handleParagraph() {
        if (singleBlockMode === "off") return false

        if (editor.isComposing()) return false

        if (!editor.isEditable()) return true

        const paragraph = getSingleParagraphRoot()

        if (!paragraph) return false

        const selection = getSingleParagraphSelection(paragraph)

        if (!selection || singleBlockMode === "single-line") return true

        selection.insertLineBreak()

        return true
      }

      function handleLineBreak(selectStart: boolean) {
        if (singleBlockMode === "off") return false

        if (editor.isComposing()) return false

        if (!editor.isEditable()) return true

        const paragraph = getSingleParagraphRoot()

        if (!paragraph) return false

        const selection = getSingleParagraphSelection(paragraph)

        if (!selection || singleBlockMode === "single-line") return true

        selection.insertLineBreak(selectStart)

        return true
      }

      function handlePaste(event: ClipboardEvent | InputEvent | KeyboardEvent) {
        if (singleBlockMode === "off") return false

        if (editor.isComposing()) return false

        if (event.defaultPrevented) return true

        if (!editor.isEditable()) {
          event.preventDefault()

          return true
        }

        const paragraph = getSingleParagraphRoot()

        if (!paragraph) return false

        if (!getSingleParagraphSelection(paragraph)) {
          event.preventDefault()

          return true
        }

        const transfer = getTransfer(event)

        if (!transfer) return false

        if (
          transfer.types.includes("text/html") ||
          transfer.types.includes("application/x-lexical-editor") ||
          transfer.types.includes("Files") ||
          !transfer.types.includes("text/plain")
        ) {
          event.preventDefault()

          return true
        }

        const text = transfer.getData("text/plain")

        if (text.length === 0) {
          event.preventDefault()

          return true
        }

        const handled = editor.dispatchCommand(
          INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND,
          text,
        )

        if (handled) {
          $addUpdateTag(PASTE_TAG)
          event.preventDefault()
        }

        return handled
      }

      return mergeRegister(
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          handleExitBreakKey,
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          INSERT_EDITOR_EXIT_BREAK_COMMAND,
          (direction) =>
            editor.isEditable() &&
            !editor.isComposing() &&
            (singleBlockMode === "off" || getSingleParagraphRoot() === null) &&
            insertExitBreak(direction),
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND,
          (mode) => {
            if (mode === "off") {
              singleBlockMode = mode

              return true
            }

            if (!editor.isEditable() || !getSingleParagraphRoot()) return false

            singleBlockMode = mode

            return true
          },
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND,
          handleSingleBlockText,
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          INSERT_PARAGRAPH_COMMAND,
          handleParagraph,
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          INSERT_LINE_BREAK_COMMAND,
          handleLineBreak,
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          PASTE_COMMAND,
          handlePaste,
          COMMAND_PRIORITY_NORMAL,
        ),
      )
    },
  })
}
