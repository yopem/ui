import type { LexicalEditor } from "lexical"

import { $createCodeNode, CodeNode } from "@lexical/code"
import {
  $removeList,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListItemNode,
} from "@lexical/list"
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import {
  $isTableNode,
  INSERT_TABLE_COMMAND,
  TableNode,
  TableCellNode,
  TableRowNode,
} from "@lexical/table"
import { $createParagraphNode, $getSelection, $isRangeSelection } from "lexical"

export interface EditorSlashCommand {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly available?: (editor: LexicalEditor) => boolean
  readonly run: (editor: LexicalEditor) => void
}

export function editorSlashCommands(
  editor: LexicalEditor,
): readonly EditorSlashCommand[] {
  const commands: EditorSlashCommand[] = [
    {
      id: "paragraph",
      label: "Paragraph",
      description: "Insert a paragraph",
      run() {
        $removeList()
        const selection = $getSelection()

        if ($isRangeSelection(selection))
          $setBlocksType(selection, $createParagraphNode)
      },
    },
  ]

  if (editor.hasNodes([HeadingNode]))
    for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"] as const)
      commands.push({
        id: level,
        label: `Heading ${level.slice(1)}`,
        description: `Insert ${level}`,
        run() {
          $removeList()
          const selection = $getSelection()

          if ($isRangeSelection(selection))
            $setBlocksType(selection, () => $createHeadingNode(level))
        },
      })

  if (editor.hasNodes([QuoteNode]))
    commands.push({
      id: "quote",
      label: "Quote",
      description: "Insert a quotation",
      run() {
        $removeList()
        const selection = $getSelection()

        if ($isRangeSelection(selection))
          $setBlocksType(selection, $createQuoteNode)
      },
    })

  if (editor.hasNodes([CodeNode]))
    commands.push({
      id: "code",
      label: "Code block",
      description: "Insert a code block",
      run() {
        $removeList()
        const selection = $getSelection()

        if ($isRangeSelection(selection))
          $setBlocksType(selection, $createCodeNode)
      },
    })

  if (editor.hasNodes([ListNode, ListItemNode]))
    for (const [id, label, command] of [
      ["bullet", "Bullet list", INSERT_UNORDERED_LIST_COMMAND],
      ["number", "Numbered list", INSERT_ORDERED_LIST_COMMAND],
      ["check", "Check list", INSERT_CHECK_LIST_COMMAND],
    ] as const)
      commands.push({
        id,
        label,
        description: `Insert ${label.toLowerCase()}`,
        run(instance) {
          instance.dispatchCommand(command, undefined)
        },
      })

  if (editor.hasNodes([TableNode, TableCellNode, TableRowNode]))
    commands.push({
      id: "table",
      label: "Table",
      description: "Insert a 3 by 3 table",
      available(instance) {
        return instance.getEditorState().read(() => {
          const selection = $getSelection()

          return (
            $isRangeSelection(selection) &&
            !selection.anchor.getNode().getParents().some($isTableNode)
          )
        })
      },
      run(instance) {
        instance.dispatchCommand(INSERT_TABLE_COMMAND, {
          columns: "3",
          rows: "3",
          includeHeaders: true,
        })
      },
    })

  return commands
}
