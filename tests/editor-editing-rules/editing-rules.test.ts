import {
  INSERT_EDITOR_EXIT_BREAK_COMMAND,
  INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND,
  SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND,
  createEditorEditingRulesExtension,
  getEditorExitBreakDirection,
} from "@editor/editing-rules"
import { CodeExtension, $createCodeNode } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension, $createQuoteNode } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  $isParagraphNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_DOWN_COMMAND,
  PASTE_COMMAND,
} from "lexical"

class TestKeyboardEvent extends Event implements KeyboardEvent {
  readonly altKey: boolean
  readonly charCode = 0
  readonly code = "Enter"
  readonly ctrlKey: boolean
  readonly isComposing: boolean
  readonly key = "Enter"
  readonly keyCode = 13
  readonly DOM_KEY_LOCATION_STANDARD = 0
  readonly DOM_KEY_LOCATION_LEFT = 1
  readonly DOM_KEY_LOCATION_RIGHT = 2
  readonly DOM_KEY_LOCATION_NUMPAD = 3
  readonly location = 0
  readonly metaKey: boolean
  readonly repeat = false
  readonly shiftKey: boolean
  readonly view = null
  readonly detail = 0
  readonly which = 13
  readonly locale = ""

  constructor(
    options: {
      altKey?: boolean
      ctrlKey?: boolean
      isComposing?: boolean
      metaKey?: boolean
      shiftKey?: boolean
    } = {},
  ) {
    super("keydown", { cancelable: true })
    this.altKey = options.altKey ?? false
    this.ctrlKey = options.ctrlKey ?? false
    this.isComposing = options.isComposing ?? false
    this.metaKey = options.metaKey ?? false
    this.shiftKey = options.shiftKey ?? false
  }

  getModifierState() {
    return false
  }

  initKeyboardEvent() {
    return undefined
  }

  initUIEvent() {
    return undefined
  }
}

class TestClipboardEvent extends Event implements ClipboardEvent {
  readonly clipboardData = null

  constructor() {
    super("paste", { cancelable: true })
  }

  initClipboardEvent() {
    return undefined
  }
}

function createEditor(mode: "off" | "single-block" | "single-line" = "off") {
  return buildEditorFromExtensions({
    name: "test/editor-editing-rules",
    dependencies: [
      RichTextExtension,
      CodeExtension,
      createEditorEditingRulesExtension({ singleBlockMode: mode }),
    ],
  })
}

function seedParagraph(editor: ReturnType<typeof createEditor>, text = "Seed") {
  editor.update(
    () => {
      const paragraph = $createParagraphNode().append($createTextNode(text))
      $getRoot().clear().append(paragraph)
      paragraph.selectEnd()
    },
    { discrete: true },
  )
}

function topLevel(editor: ReturnType<typeof createEditor>) {
  return editor.read(() =>
    $getRoot()
      .getChildren()
      .map((node) => ({ type: node.getType(), text: node.getTextContent() })),
  )
}

test("exit-break recognizes only unprevented Mod+Enter outside composition", () => {
  const event = new TestKeyboardEvent({ ctrlKey: true })
  expect(getEditorExitBreakDirection(event)).toBe("after")
  expect(
    getEditorExitBreakDirection(
      new TestKeyboardEvent({ metaKey: true, shiftKey: true }),
    ),
  ).toBe("before")
  expect(
    getEditorExitBreakDirection(
      new TestKeyboardEvent({ ctrlKey: true, altKey: true }),
    ),
  ).toBeNull()
  expect(getEditorExitBreakDirection(new TestKeyboardEvent())).toBeNull()
  expect(
    getEditorExitBreakDirection(
      new TestKeyboardEvent({ ctrlKey: true, isComposing: true }),
    ),
  ).toBeNull()
  event.preventDefault()
  expect(getEditorExitBreakDirection(event)).toBeNull()
})

test("exit-break inserts outside nested quotes and preserves their content", () => {
  const editor = createEditor()
  editor.update(
    () => {
      const text = $createTextNode("Quoted text")

      const quote = $createQuoteNode().append(
        $createParagraphNode().append(text),
      )

      $getRoot().clear().append(quote)
      text.selectEnd()
    },
    { discrete: true },
  )

  expect(
    editor.dispatchCommand(INSERT_EDITOR_EXIT_BREAK_COMMAND, "after"),
  ).toBe(true)
  expect(topLevel(editor)).toEqual([
    { type: "quote", text: "Quoted text" },
    { type: "paragraph", text: "" },
  ])
  editor.dispose()
})

test("exit-break before code block keeps code and inserts a paragraph at root", () => {
  const editor = createEditor()
  editor.update(
    () => {
      const code = $createCodeNode("javascript").append(
        $createTextNode("const value = 1"),
      )

      $getRoot().clear().append(code)
      code.getFirstChildOrThrow().selectEnd()
    },
    { discrete: true },
  )

  expect(
    editor.dispatchCommand(INSERT_EDITOR_EXIT_BREAK_COMMAND, "before"),
  ).toBe(true)
  expect(topLevel(editor)).toEqual([
    { type: "paragraph", text: "" },
    { type: "code", text: "const value = 1" },
  ])
  editor.dispose()
})

test("exit-break respects key veto and read-only state", () => {
  const editor = createEditor()
  seedParagraph(editor)
  const veto = new TestKeyboardEvent({ ctrlKey: true })
  editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event) => {
      event.preventDefault()

      return true
    },
    COMMAND_PRIORITY_HIGH,
  )
  expect(editor.dispatchCommand(KEY_DOWN_COMMAND, veto)).toBe(true)
  expect(topLevel(editor)).toEqual([{ type: "paragraph", text: "Seed" }])

  editor.setEditable(false)
  expect(
    editor.dispatchCommand(INSERT_EDITOR_EXIT_BREAK_COMMAND, "after"),
  ).toBe(false)
  expect(topLevel(editor)).toEqual([{ type: "paragraph", text: "Seed" }])
  editor.dispose()
})

test("single-block mode inserts soft breaks and single-line mode strips newlines", () => {
  const editor = createEditor("single-block")
  seedParagraph(editor)
  expect(
    editor.dispatchCommand(
      INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND,
      " one\r\ntwo",
    ),
  ).toBe(true)
  expect(topLevel(editor)).toEqual([
    { type: "paragraph", text: "Seed one\ntwo" },
  ])
  expect(
    editor.dispatchCommand(SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND, "single-line"),
  ).toBe(true)
  expect(editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)).toBe(true)
  expect(editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false)).toBe(true)
  expect(
    editor.dispatchCommand(
      INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND,
      "A\r\nB\nC",
    ),
  ).toBe(true)
  expect(topLevel(editor)).toEqual([
    { type: "paragraph", text: "Seed one\ntwoABC" },
  ])
  editor.dispose()
})

test("single-block mode rejects multi-block documents without flattening them", () => {
  const editor = createEditor()
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("First")),
          $createParagraphNode().append($createTextNode("Second")),
        )
      $getRoot().getLastChildOrThrow().selectEnd()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()

  expect(
    editor.dispatchCommand(
      SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND,
      "single-block",
    ),
  ).toBe(false)
  expect(
    editor.dispatchCommand(INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND, "Lost"),
  ).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  editor.dispose()
})

test("single-block paste remains below host HIGH and CRITICAL vetoes", () => {
  for (const priority of [
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_CRITICAL,
  ] as const) {
    const editor = createEditor("single-block")
    seedParagraph(editor)
    let hostCalls = 0
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        hostCalls++
        event.preventDefault()

        return true
      },
      priority,
    )
    const event = new TestClipboardEvent()

    expect(editor.dispatchCommand(PASTE_COMMAND, event)).toBe(true)
    expect(hostCalls).toBe(1)
    expect(topLevel(editor)).toEqual([{ type: "paragraph", text: "Seed" }])
    editor.dispose()
  }
})

test("single-paragraph modes keep exit-break shortcuts inside the paragraph", () => {
  for (const mode of ["single-block", "single-line"] as const) {
    const editor = createEditor(mode)

    try {
      for (const before of [false, true]) {
        seedParagraph(editor)
        const event = new TestKeyboardEvent({ ctrlKey: true, shiftKey: before })
        editor.update(
          () => {
            expect(editor.dispatchCommand(KEY_DOWN_COMMAND, event)).toBe(true)
            expect($getRoot().getChildren()).toHaveLength(1)
            expect($getRoot().getFirstChild()?.getType()).toBe("paragraph")
          },
          { discrete: true },
        )
        expect(event.defaultPrevented).toBe(true)

        if (mode === "single-line")
          expect(topLevel(editor)).toEqual([
            { type: "paragraph", text: "Seed" },
          ])
      }

      seedParagraph(editor)
      editor.update(
        () => {
          expect(
            editor.dispatchCommand(INSERT_EDITOR_EXIT_BREAK_COMMAND, "after"),
          ).toBe(false)
        },
        { discrete: true },
      )
      expect(topLevel(editor)).toEqual([{ type: "paragraph", text: "Seed" }])
    } finally {
      editor.dispose()
    }
  }
})

test("single-line converted-empty and bounded text rejection preserve the selected content", () => {
  const editor = createEditor("single-line")

  try {
    for (const input of ["\r\n\n", "x".repeat(1048577), "é".repeat(524289)]) {
      seedParagraph(editor, "Keep selected text")
      editor.update(
        () => {
          const paragraph = $getRoot().getFirstChild()

          if (!$isParagraphNode(paragraph))
            throw new Error("Missing native paragraph")
          const text = paragraph.getFirstDescendant()

          if (!$isTextNode(text))
            throw new Error("Missing native paragraph text")
          text.select(0, text.getTextContentSize())
          expect(
            editor.dispatchCommand(
              INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND,
              input,
            ),
          ).toBe(true)
        },
        { discrete: true },
      )
      expect(topLevel(editor)).toEqual([
        { type: "paragraph", text: "Keep selected text" },
      ])
    }
  } finally {
    editor.dispose()
  }
})
