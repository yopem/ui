import { tableBorderSchema } from "@editor/table-presentation-schema"
import {
  $createTableNodeWithDimensions,
  $isTableCellNode,
  $isTableRowNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setState,
  createEditor,
  createState,
} from "lexical"
import { z } from "zod"

const borderSchema = tableBorderSchema.catch(null)

const tableCellBorderState = createState("yopemTableBorder", {
  parse(value) {
    return borderSchema.parse(value)
  },
})

function snapshot(write: () => void) {
  const editor = createEditor({
    nodes: [TableNode, TableRowNode, TableCellNode],
    onError(error) {
      throw error
    },
  })

  editor.update(write, { discrete: true })

  return z
    .json()
    .parse(JSON.parse(JSON.stringify(editor.getEditorState().toJSON())))
}

export function nativeSnapshots() {
  return [
    {
      documentId: "app:native-table-limit",
      state: snapshot(function table() {
        $getRoot().append($createTableNodeWithDimensions(50, 50))
      }),
    },
    {
      documentId: "app:native-styled-table-limit",
      state: snapshot(function styledTable() {
        const table = $createTableNodeWithDimensions(50, 50)

        for (const row of table.getChildren()) {
          if (!$isTableRowNode(row)) throw new Error("Native row missing")
          row.setHeight(28)

          for (const cell of row.getChildren()) {
            if (!$isTableCellNode(cell)) throw new Error("Native cell missing")
            cell.setBackgroundColor("#ffff00")
            $setState(cell, tableCellBorderState, {
              top: "solid",
              bottom: "hidden",
              start: "solid",
              end: "hidden",
            })
          }
        }

        $getRoot().append(table)
      }),
    },
    {
      documentId: "app:native-long-paragraph",
      state: snapshot(function paragraph() {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("x".repeat(100001))),
        )
      }),
    },
  ]
}
