import type { LexicalEditor } from "lexical"

import { createEditorBlockSelection } from "@editor/block-selection"
import { EditorBlocksExtension } from "@editor/blocks-extension"
import { $createCalloutNode } from "@editor/blocks-model"
import { GetClipboardDataExtension } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $setSelection,
  $setSlot,
  configExtension,
  BEFORE_INPUT_COMMAND,
  COMMAND_PRIORITY_HIGH,
  CUT_COMMAND,
  DELETE_CHARACTER_COMMAND,
  HISTORY_PUSH_TAG,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
} from "lexical"

function setup(owner: "target" | "descendant" | "none") {
  let authorizations = 0
  let validations = 0

  const controller = createEditorBlockSelection({
    authorizeCut() {
      authorizations++

      return true
    },
    validateDocument() {
      validations++

      return true
    },
  })

  const editor = buildEditorFromExtensions({
    name: "test/block-selection-slot-cut-delete",
    dependencies: [
      RichTextExtension,
      EditorBlocksExtension,
      controller.extension,
      configExtension(GetClipboardDataExtension, {
        $exportMimeType: {
          "text/plain": [(selection) => selection?.getTextContent() ?? null],
          "text/html": [() => null],
          "application/x-lexical-editor": [() => null],
          "text/uri-list": [() => null],
        },
      }),
    ],
  })

  const history = createEmptyHistoryState()
  const disposeHistory = registerHistory(editor, history, 300)
  editor.update(
    () => {
      const child = $createParagraphNode().append($createTextNode("nested"))
      const block = $createCalloutNode().append(child)

      if (owner !== "none")
        $setSlot(
          owner === "target" ? block : child,
          "secret",
          $createParagraphNode().append($createTextNode("private")),
        )
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("safe")),
          block,
          $createParagraphNode().append($createTextNode("retained")),
        )
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode("history")),
      )
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
  const keys = editor.read(() => $getRoot().getChildrenKeys())
  controller.select(keys[0])
  controller.select(keys[1], { toggle: true })

  return {
    controller,
    editor,
    keys,
    history,
    disposeHistory,
    counts: () => [authorizations, validations],
  }
}

class TestUIEvent extends Event implements UIEvent {
  readonly detail = 0
  readonly view = null
  readonly which = 0
  initUIEvent(type: string, bubbles = false, cancelable = false) {
    this.initEvent(type, bubbles, cancelable)
  }
}

class TestKeyboardEvent extends TestUIEvent implements KeyboardEvent {
  readonly altKey = false
  readonly charCode = 0
  readonly code = ""
  readonly ctrlKey = false
  readonly isComposing = false
  readonly keyCode = 0
  readonly location = 0
  readonly metaKey = false
  readonly repeat = false
  readonly shiftKey = false
  readonly DOM_KEY_LOCATION_STANDARD = 0
  readonly DOM_KEY_LOCATION_LEFT = 1
  readonly DOM_KEY_LOCATION_RIGHT = 2
  readonly DOM_KEY_LOCATION_NUMPAD = 3

  constructor(readonly key: string) {
    super("keydown", { cancelable: true })
  }

  getModifierState() {
    return false
  }

  initKeyboardEvent(type: string, bubbles = false, cancelable = false) {
    this.initEvent(type, bubbles, cancelable)
  }
}

class TestInputEvent extends TestUIEvent implements InputEvent {
  readonly data = null
  readonly dataTransfer = null
  readonly isComposing = false

  constructor(readonly inputType: string) {
    super("beforeinput", { cancelable: true })
  }

  getTargetRanges(): StaticRange[] {
    return []
  }
}

class TestClipboardEvent extends Event implements ClipboardEvent {
  readonly clipboardData: DataTransfer | null = null
}

function keyEvent(key: string) {
  return new TestKeyboardEvent(key)
}

function clipboard() {
  const values = new Map([["text/plain", "previous clipboard"]])
  let writes = 0
  const event = new TestClipboardEvent("cut", { cancelable: true })
  Object.defineProperty(event, "clipboardData", {
    value: {
      setData(mime: string, value: string) {
        writes++
        values.set(mime, value)
      },
      getData(mime: string) {
        return values.get(mime) ?? ""
      },
    },
  })

  return { event, values, writes: () => writes }
}

function state(editor: LexicalEditor) {
  return {
    json: editor.getEditorState().toJSON(),
    selection: editor.read(() => $getSelection()?.clone()),
  }
}

for (const owner of ["target", "descendant"] as const) {
  for (const action of [
    "keydown-backspace",
    "keydown-delete",
    "key-backspace",
    "key-delete",
    "beforeinput-backward",
    "beforeinput-forward",
    "command",
  ] as const) {
    test(`${action} preserves mixed selection with ${owner} slot`, () => {
      const { editor, controller, history, disposeHistory } = setup(owner)
      const before = state(editor)
      const stacks = [history.undoStack.length, history.redoStack.length]
      const key = action.includes("backspace") ? "Backspace" : "Delete"
      const event = keyEvent(key)

      const input = new TestInputEvent(
        action.endsWith("backward")
          ? "deleteContentBackward"
          : "deleteContentForward",
      )

      editor.update(
        () => {
          if (action.startsWith("keydown"))
            editor.dispatchCommand(KEY_DOWN_COMMAND, event)
          else if (action === "key-backspace")
            editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event)
          else if (action === "key-delete")
            editor.dispatchCommand(KEY_DELETE_COMMAND, event)
          else if (action.startsWith("beforeinput"))
            editor.dispatchCommand(BEFORE_INPUT_COMMAND, input)
          else editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true)
        },
        { discrete: true },
      )
      expect(editor.getEditorState().toJSON()).toEqual(before.json)
      expect(editor.read(() => before.selection?.is($getSelection()))).toBe(
        true,
      )
      expect(controller.getSnapshot().selected).toHaveLength(2)
      expect([history.undoStack.length, history.redoStack.length]).toEqual(
        stacks,
      )

      if (action.startsWith("keydown") || action.startsWith("key-"))
        expect(event.defaultPrevented).toBe(true)

      if (action.startsWith("beforeinput"))
        expect(input.defaultPrevented).toBe(true)
      disposeHistory()
      editor.dispose()
    })
  }

  test(`cut refuses ${owner} slot before authorization, validation, and clipboard writes`, () => {
    const { editor, controller, history, disposeHistory, counts } = setup(owner)
    const before = state(editor)
    const stacks = [history.undoStack.length, history.redoStack.length]
    const transfer = clipboard()
    editor.update(() => editor.dispatchCommand(CUT_COMMAND, transfer.event), {
      discrete: true,
    })
    expect(transfer.event.defaultPrevented).toBe(true)
    expect(transfer.writes()).toBe(0)
    expect(transfer.values.get("text/plain")).toBe("previous clipboard")
    expect(counts()).toEqual([0, 0])
    expect(editor.getEditorState().toJSON()).toEqual(before.json)
    expect(editor.read(() => before.selection?.is($getSelection()))).toBe(true)
    expect(controller.getSnapshot().selected).toHaveLength(2)
    expect([history.undoStack.length, history.redoStack.length]).toEqual(stacks)
    disposeHistory()
    editor.dispose()
  })
}

test("safe selected blocks keep native delete and retain unselected slots", () => {
  const { editor, controller, keys, disposeHistory } = setup("target")
  controller.select(keys[0])
  editor.update(() => editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true), {
    discrete: true,
  })
  expect(editor.read(() => $getRoot().getChildrenKeys())).toEqual(keys.slice(1))
  expect(JSON.stringify(editor.getEditorState().toJSON())).toContain("private")
  disposeHistory()
  editor.dispose()
})

test("unowned node selection keeps native deletion", () => {
  const { editor, keys, disposeHistory } = setup("target")
  editor.update(
    () => {
      const selection = $createNodeSelection()
      selection.add(keys[1])
      $setSelection(selection)
      editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true)
    },
    { discrete: true },
  )
  expect(editor.read(() => $getRoot().getChildrenKeys())).toEqual([
    keys[0],
    keys[2],
    keys[3],
  ])
  disposeHistory()
  editor.dispose()
})

test("higher priority host cancellation remains authoritative", () => {
  const { editor, disposeHistory } = setup("target")
  const before = state(editor)

  const stop = editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    (event) => {
      event.preventDefault()

      return false
    },
    COMMAND_PRIORITY_HIGH,
  )

  const event = keyEvent("Backspace")
  editor.update(() => editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event), {
    discrete: true,
  })
  expect(editor.getEditorState().toJSON()).toEqual(before.json)
  expect(editor.read(() => before.selection?.is($getSelection()))).toBe(true)
  stop()
  disposeHistory()
  editor.dispose()
})
