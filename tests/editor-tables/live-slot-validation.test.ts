import {
  EditorTablePresentationExtension,
  registerTablePresentationValidation,
  TABLE_PRESENTATION_ERROR_COMMAND,
} from "@editor/table-presentation"
import { buildEditorFromExtensions } from "@lexical/extension"
import {
  $createTableCellNode,
  $createTableNodeWithDimensions,
  $createTableRowNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSlot,
  $isSlotChild,
  $isSlotHost,
  $removeSlot,
  $setSlot,
  createEditor,
  DecoratorNode,
  COMMAND_PRIORITY_HIGH,
  RootNode,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
} from "lexical"

class SlotDecorator extends DecoratorNode<null> {
  static getType() {
    return "table-test-decorator"
  }

  static clone(node: SlotDecorator) {
    return new SlotDecorator(node.__key)
  }

  static importJSON() {
    return new SlotDecorator()
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  createDOM(): HTMLElement {
    throw new Error("No DOM in this test")
  }

  updateDOM() {
    return false
  }

  isInline() {
    return false
  }

  decorate() {
    return null
  }
}

const exportFailure = new Error("host export failed")

let failExport = false

class FailingDecorator extends SlotDecorator {
  static getType() {
    return "table-test-failing-decorator"
  }

  static clone(node: FailingDecorator) {
    return new FailingDecorator(node.__key)
  }

  static importJSON() {
    return new FailingDecorator()
  }

  exportJSON() {
    if (failExport) throw exportFailure

    return super.exportJSON()
  }
}

function setup() {
  const errors: Error[] = []

  const editor = createEditor({
    nodes: [TableNode, TableRowNode, TableCellNode, SlotDecorator],
    onError(error) {
      errors.push(error)
    },
  })

  registerTablePresentationValidation(editor)

  return { editor, errors }
}

function slot(host: LexicalNode, name: string) {
  const value = $getSlot(host, name)

  if (!value || !$isSlotChild(value)) throw new Error(`Missing slot ${name}`)

  return value
}

test("valid root, element and decorator slots survive moves and removal", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const paragraph = $createParagraphNode().append($createTextNode("keep"))
      const decorator = new SlotDecorator()
      $getRoot().append(paragraph, decorator)
      $setSlot($getRoot(), "root", $createTableNodeWithDimensions(1, 1, false))
      $setSlot(
        paragraph,
        "element",
        $createTableNodeWithDimensions(1, 1, false),
      )
      $setSlot(
        decorator,
        "decorator",
        $createTableNodeWithDimensions(1, 1, false),
      )
    },
    { discrete: true },
  )
  expect(errors).toHaveLength(0)
  editor.getEditorState().read(() => {
    const decorator = $getRoot().getLastChildOrThrow()

    expect(decorator).toBeInstanceOf(SlotDecorator)
    expect(slot(decorator, "decorator")).toBeInstanceOf(TableNode)
  })
  editor.update(
    () => {
      const root = $getRoot()
      const paragraph = root.getFirstChildOrThrow()
      const decorator = root.getLastChildOrThrow()

      if (!$isSlotHost(decorator)) throw new Error("Missing slot host")
      $setSlot(decorator, "moved", slot(paragraph, "element"))
      $removeSlot(root, "root")
    },
    { discrete: true },
  )
  expect(errors).toHaveLength(0)
  editor.getEditorState().read(() => {
    const root = $getRoot()
    const decorator = root.getLastChildOrThrow()
    expect($getSlot(root, "root")).toBeNull()
    expect($getSlot(root.getFirstChildOrThrow(), "element")).toBeNull()
    expect(slot(decorator, "decorator")).toBeInstanceOf(TableNode)
    expect(slot(decorator, "moved")).toBeInstanceOf(TableNode)
    expect(root.getFirstChildOrThrow().getTextContent()).toBe("keep")
  })
})

test.each(["table", "cell", "decorator"])(
  "rejects nested tables through %s slots without changing prior state",
  (kind) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("keep")),
        )
        const outer = $createTableNodeWithDimensions(1, 1, false)
        $setSlot($getRoot(), "table", outer)

        if (kind === "decorator") {
          const cell = outer
            .getFirstChildOrThrow<TableRowNode>()
            .getFirstChildOrThrow<TableCellNode>()

          cell.append(new SlotDecorator())
        }
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(0)
    const before = editor.getEditorState().toJSON()
    editor.update(
      () => {
        const outer = slot($getRoot(), "table")

        if (!(outer instanceof TableNode)) throw new Error("Missing table")

        const cell = outer
          .getFirstChildOrThrow<TableRowNode>()
          .getFirstChildOrThrow<TableCellNode>()

        const host =
          kind === "table"
            ? outer
            : kind === "cell"
              ? cell
              : cell.getLastChildOrThrow()

        const middle = $createParagraphNode()

        if (!$isSlotHost(host)) throw new Error("Missing slot host")
        $setSlot(host, "middle", middle)
        $setSlot(middle, "nested", $createTableNodeWithDimensions(1, 1, false))
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(1)
    expect(editor.getEditorState().toJSON()).toEqual(before)
  },
)

test.each(["row", "cell"])(
  "a slotted %s cannot substitute for an ordinary parent edge",
  (kind) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        $getRoot().append($createTableNodeWithDimensions(1, 1, false))
      },
      { discrete: true },
    )
    const before = editor.getEditorState().toJSON()
    editor.update(
      () => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const row = table.getFirstChildOrThrow<TableRowNode>()

        if (kind === "row") $setSlot(table, "orphan", $createTableRowNode())
        else $setSlot(row, "orphan", $createTableCellNode())
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(1)
    expect(editor.getEditorState().toJSON()).toEqual(before)
  },
)

test.each([64, 65])("combined slot depth %i obeys traversal limit", (depth) => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      let host: ElementNode = $getRoot()

      for (let index = 0; index < depth; index += 1) {
        const next = $createParagraphNode()
        $setSlot(host, "next", next)
        host = next
      }
    },
    { discrete: true },
  )
  expect(errors).toHaveLength(depth === 64 ? 0 : 1)
})

test.each([10000, 10001])(
  "combined slot node count %i obeys traversal limit",
  (count) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        const root = $getRoot()

        for (let branch = 0; branch < 99; branch += 1) {
          const host = $createParagraphNode()
          $setSlot(root, `branch-${branch}`, host)

          for (let index = 0; index < 100; index += 1)
            $setSlot(host, `slot-${index}`, $createParagraphNode())
        }

        if (count === 10001) $setSlot(root, "extra", $createParagraphNode())
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(count === 10000 ? 0 : 1)
  },
)

function createValidationHarness(kind: "helper" | "extension", throws = false) {
  const errors: Error[] = []
  const tableErrors: Error[] = []

  function onError(error: Error) {
    errors.push(error)

    if (throws) throw error
  }

  const editor =
    kind === "helper"
      ? createEditor({
          nodes: [TableNode, TableRowNode, TableCellNode, FailingDecorator],
          onError,
        })
      : buildEditorFromExtensions({
          name: "test/table-validation",
          dependencies: [EditorTablePresentationExtension],
          nodes: [FailingDecorator],
          onError,
        })

  if (kind === "helper") registerTablePresentationValidation(editor)
  editor.registerCommand(
    TABLE_PRESENTATION_ERROR_COMMAND,
    (error) => {
      tableErrors.push(error)

      return true
    },
    COMMAND_PRIORITY_HIGH,
  )
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("keep")))
    },
    { discrete: true },
  )

  return { editor, errors, tableErrors }
}

function insertInvalidTable() {
  const outer = $createTableNodeWithDimensions(1, 1, false)

  const cell = outer
    .getFirstChildOrThrow<TableRowNode>()
    .getFirstChildOrThrow<TableCellNode>()

  $setSlot(cell, "nested", $createTableNodeWithDimensions(1, 1, false))
  $getRoot().append(outer)
}

test.each(["helper", "extension"] as const)(
  "%s rejects an invalid update queued by a root transform",
  async (kind) => {
    const { editor, errors, tableErrors } = createValidationHarness(kind)
    let armed = false
    let queued = false
    let executed = false

    const unregister = editor.registerNodeTransform(RootNode, () => {
      if (!armed || queued) return

      queued = true
      editor.update(() => {
        executed = true
        insertInvalidTable()
      })
    })

    editor.update(() => $getRoot().markDirty(), { discrete: true })
    const before = editor.getEditorState().toJSON()
    armed = true
    editor.update(
      () => {
        $getRoot().getFirstChildOrThrow().markDirty()
      },
      { discrete: true },
    )
    unregister()
    await Promise.resolve()
    expect(queued).toBe(true)
    expect(executed).toBe(true)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(errors.length + tableErrors.length).toBe(1)
  },
)

test.each(["helper", "extension"] as const)(
  "%s retains an earlier coalesced valid edit when a later update is invalid",
  async (kind) => {
    const { editor, errors, tableErrors } = createValidationHarness(kind)
    editor.update(() => {
      $getRoot().append($createParagraphNode().append($createTextNode("valid")))
    })
    editor.update(insertInvalidTable, { discrete: true })
    await Promise.resolve()
    expect(
      editor.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe("keep\n\nvalid")
    expect(errors.length + tableErrors.length).toBe(1)
  },
)

test("a throwing helper onError preserves committed state and permits a later valid update", () => {
  const { editor, errors } = createValidationHarness("helper", true)
  const before = editor.getEditorState().toJSON()
  expect(() => editor.update(insertInvalidTable, { discrete: true })).toThrow()
  expect(errors).toHaveLength(1)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  editor.update(
    () => {
      $getRoot().append($createParagraphNode().append($createTextNode("after")))
    },
    { discrete: true },
  )
  expect(editor.getEditorState().read(() => $getRoot().getTextContent())).toBe(
    "keep\n\nafter",
  )
})

test("the extension handles table errors itself even when the host onError throws", async () => {
  const { editor, errors, tableErrors } = createValidationHarness(
    "extension",
    true,
  )

  const before = editor.getEditorState().toJSON()

  editor.update(insertInvalidTable, { discrete: true })
  await Promise.resolve()
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(errors).toHaveLength(0)
  expect(tableErrors).toHaveLength(1)
})

test.each(["helper", "extension"] as const)(
  "%s passes unexpected export errors to the host unchanged",
  async (kind) => {
    const { editor, errors, tableErrors } = createValidationHarness(kind)
    editor.update(() => $getRoot().append(new FailingDecorator()), {
      discrete: true,
    })
    const before = editor.getEditorState().toJSON()

    failExport = true

    try {
      editor.update(() => $getRoot().getFirstChildOrThrow().markDirty(), {
        discrete: true,
      })
    } finally {
      failExport = false
    }

    await Promise.resolve()
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(errors).toEqual([exportFailure])
    expect(tableErrors).toHaveLength(0)
  },
)

test.each([false, true])(
  "covered cell budget includes ordinary and slotted tables, excess=%s",
  (excess) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        $getRoot().append($createTableNodeWithDimensions(25, 50, false))
        $setSlot(
          $getRoot(),
          "table",
          $createTableNodeWithDimensions(25, 50, false),
        )

        if (excess)
          $setSlot(
            $getRoot(),
            "excess",
            $createTableNodeWithDimensions(1, 1, false),
          )
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(excess ? 1 : 0)
  },
)
