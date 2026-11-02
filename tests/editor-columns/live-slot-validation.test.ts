import {
  $insertEditorColumns,
  $removeEditorColumns,
  registerEditorColumnsValidation,
} from "@editor/columns-extension"
import {
  $createEditorColumnNode,
  $createEditorColumnsGroupNode,
  EditorColumnNode,
  EditorColumnsGroupNode,
} from "@editor/columns-node"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getSlot,
  $isRangeSelection,
  $isSlotHost,
  $removeSlot,
  $setSlot,
  createEditor,
  DecoratorNode,
  type ParagraphNode,
  type LexicalNode,
  type NodeKey,
} from "lexical"

class SlotDecorator extends DecoratorNode<null> {
  static getType() {
    return "column-test-decorator"
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

  decorate() {
    return null
  }
}

function group() {
  return $createEditorColumnsGroupNode([50, 50]).append(
    $createEditorColumnNode().append($createParagraphNode()),
    $createEditorColumnNode().append($createParagraphNode()),
  )
}

function setup() {
  const errors: Error[] = []

  const editor = createEditor({
    nodes: [EditorColumnNode, EditorColumnsGroupNode, SlotDecorator],
    onError(error) {
      errors.push(error)
    },
  })

  registerEditorColumnsValidation(editor)

  return { editor, errors }
}

function selectionSnapshot() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return null

  return {
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
    backward: selection.isBackward(),
  }
}

function slot(host: LexicalNode, name: string) {
  const value = $getSlot(host, name)

  if (!value) throw new Error(`Missing slot ${name}`)

  return value
}

test("valid root, element and decorator slots retain independent structures through moves", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const paragraph = $createParagraphNode().append(
        $createTextNode("ordinary"),
      )

      const decorator = new SlotDecorator()
      $getRoot().append(paragraph, decorator)
      $setSlot($getRoot(), "root", group())
      $setSlot(paragraph, "element", group())
      $setSlot(decorator, "decorator", group())
    },
    { discrete: true },
  )
  expect(errors).toHaveLength(0)
  editor.update(
    () => {
      const root = $getRoot()
      const paragraph = root.getFirstChildOrThrow()

      const decorator = root
        .getLastChildOrThrow<ParagraphNode>()
        .getFirstChildOrThrow()

      if (!(decorator instanceof SlotDecorator))
        throw new Error("Missing decorator")
      $setSlot(decorator, "moved", slot(paragraph, "element"))
      $removeSlot(root, "root")
    },
    { discrete: true },
  )
  expect(errors).toEqual([])
  editor.getEditorState().read(() => {
    const root = $getRoot()

    const decorator = root
      .getLastChildOrThrow<ParagraphNode>()
      .getFirstChildOrThrow()

    expect($getSlot(root, "root")).toBeNull()
    expect($getSlot(root.getFirstChildOrThrow(), "element")).toBeNull()
    expect(slot(decorator, "decorator")).toBeInstanceOf(EditorColumnsGroupNode)
    expect(slot(decorator, "moved")).toBeInstanceOf(EditorColumnsGroupNode)
    expect(root.getFirstChildOrThrow().getTextContent()).toBe("ordinary")
  })
})

test.each(["group", "column", "decorator"])(
  "rejects nested columns across %s slot ancestry and preserves state",
  (kind) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("keep")),
        )
        const outer = group()
        $setSlot($getRoot(), "columns", outer)

        if (kind === "decorator") {
          const decorator = new SlotDecorator()
          outer.getFirstChildOrThrow<EditorColumnNode>().append(decorator)
        }
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(0)
    const before = editor.getEditorState().toJSON()
    editor.update(
      () => {
        const outer = slot($getRoot(), "columns")

        if (!(outer instanceof EditorColumnsGroupNode))
          throw new Error("Missing group")
        const column = outer.getFirstChildOrThrow<EditorColumnNode>()

        const host =
          kind === "group"
            ? outer
            : kind === "column"
              ? column
              : column.getLastChildOrThrow()

        if (
          !(
            host instanceof EditorColumnsGroupNode ||
            host instanceof EditorColumnNode ||
            host instanceof SlotDecorator
          )
        )
          throw new Error("Invalid host")
        const middle = $createParagraphNode()
        $setSlot(host, "middle", middle)
        $setSlot(middle, "nested", group())
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(1)
    expect(editor.getEditorState().toJSON()).toEqual(before)
  },
)

test("a column in a group slot is not an ordinary group child", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      $getRoot().append(group())
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  editor.update(
    () => {
      const host = $getRoot().getFirstChildOrThrow<EditorColumnsGroupNode>()
      $setSlot(
        host,
        "orphan",
        $createEditorColumnNode().append($createParagraphNode()),
      )
    },
    { discrete: true },
  )
  expect(errors).toHaveLength(1)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("removing a group with owned slot content is rejected before selection or document changes", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const outer = group()
      const column = outer.getFirstChildOrThrow<EditorColumnNode>()
      $setSlot(
        column,
        "keep",
        $createParagraphNode().append($createTextNode("slot content")),
      )
      $getRoot().append(outer, $createParagraphNode())
      column.selectStart()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  const selection = editor.getEditorState().read(selectionSnapshot)
  editor.update(() => expect($removeEditorColumns()).toBe(false), {
    discrete: true,
  })
  expect(errors).toHaveLength(0)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(editor.getEditorState().read(selectionSnapshot)).toEqual(selection)
})

test("nested insertion from a slot inside columns is rejected without mutation", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const outer = group()
      const column = outer.getFirstChildOrThrow<EditorColumnNode>()
      const inner = $createParagraphNode().append($createTextNode("caret"))
      $setSlot(column, "note", inner)
      $getRoot().append(outer)
      inner.selectStart()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  const selection = editor.getEditorState().read(selectionSnapshot)
  editor.update(() => expect($insertEditorColumns([50, 50])).toBe(false), {
    discrete: true,
  })
  expect(errors).toHaveLength(0)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(editor.getEditorState().read(selectionSnapshot)).toEqual(selection)
})

test("edits inside an attached slot are validated before commit", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const outer = group()
      const column = outer.getFirstChildOrThrow<EditorColumnNode>()
      $setSlot(
        column,
        "note",
        $createParagraphNode().append($createTextNode("keep")),
      )
      $getRoot().append(outer)
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  editor.update(
    () => {
      const outer = $getRoot().getFirstChildOrThrow<EditorColumnsGroupNode>()
      const column = outer.getFirstChildOrThrow<EditorColumnNode>()
      const note = slot(column, "note")

      if (!$isSlotHost(note)) throw new Error("Invalid slot host")
      $setSlot(note, "nested", group())
    },
    { discrete: true },
  )
  expect(errors).toHaveLength(1)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("a directly slotted group cannot be removed with ordinary tree operations", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const outer = group()
      $setSlot($getRoot(), "columns", outer)
      outer.getFirstChildOrThrow<EditorColumnNode>().selectStart()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  editor.update(() => expect($removeEditorColumns()).toBe(false), {
    discrete: true,
  })
  expect(errors).toHaveLength(0)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("insertion in a slot without columns does not replace its host", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const host = $createParagraphNode().append($createTextNode("host"))
      const inner = $createParagraphNode().append($createTextNode("slot"))
      $getRoot().append(host)
      $setSlot(host, "note", inner)
      inner.selectStart()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  editor.update(() => expect($insertEditorColumns([50, 50])).toBe(false), {
    discrete: true,
  })
  expect(errors).toHaveLength(0)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("insertion inside a directly slotted group is rejected without mutation", () => {
  const { editor, errors } = setup()
  editor.update(
    () => {
      const outer = group()
      $setSlot($getRoot(), "columns", outer)
      outer.getFirstChildOrThrow<EditorColumnNode>().selectStart()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  const selection = editor.getEditorState().read(selectionSnapshot)
  editor.update(() => expect($insertEditorColumns([50, 50])).toBe(false), {
    discrete: true,
  })
  expect(errors).toHaveLength(0)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(editor.getEditorState().read(selectionSnapshot)).toEqual(selection)
})

test.each([9992, 9993])(
  "ordinary and slot nodes share the live node budget with %i ordinary extras",
  (extras) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        const root = $getRoot()
        root.append(group())
        const paragraph = $createParagraphNode()
        root.append(paragraph)

        for (let index = 0; index < extras; index += 1) {
          const text = $createTextNode("x")

          if (index % 2) text.toggleFormat("bold")
          paragraph.append(text)
        }

        $setSlot(root, "extra", $createParagraphNode())
      },
      { discrete: true },
    )

    if (extras === 9992) expect(errors).toEqual([])
    else expect(errors).toHaveLength(1)
  },
)

test.each([64, 65])(
  "combined child and slot depth %i applies the column limit",
  (depth) => {
    const { editor, errors } = setup()
    editor.update(
      () => {
        $getRoot().append(group())
        let host = $createParagraphNode()
        $setSlot($getRoot(), "deep", host)

        for (let i = 1; i < depth; i += 1) {
          const next = $createParagraphNode()
          $setSlot(host, "next", next)
          host = next
        }
      },
      { discrete: true },
    )
    expect(errors).toHaveLength(depth === 64 ? 0 : 1)
  },
)
