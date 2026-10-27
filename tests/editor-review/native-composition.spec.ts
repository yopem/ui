import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { RichTextExtension } from "@lexical/rich-text"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setCompositionKey,
  COMMAND_PRIORITY_CRITICAL,
  DELETE_CHARACTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  configExtension,
  defineExtension,
} from "lexical"
import { parseHTML } from "linkedom"

function setup(name: string) {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        RichTextExtension,
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)

  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })

  return { editor, review }
}

test("composing native breaks and deletes stay unsupported and honor host veto", () => {
  const previous = new Map(
    [
      "window",
      "document",
      "HTMLElement",
      "Element",
      "Node",
      "Event",
      "InputEvent",
      "MutationObserver",
      "getComputedStyle",
    ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  )

  const { window, document } = parseHTML(
    '<!doctype html><html><body><div id="editor"></div></body></html>',
  )

  for (const [key, value] of Object.entries({
    window,
    document,
    HTMLElement: window.HTMLElement,
    Element: window.Element,
    Node: window.Node,
    Event: window.Event,
    InputEvent: window.InputEvent,
    MutationObserver: window.MutationObserver,
    getComputedStyle: () => ({ display: "block", getPropertyValue: () => "" }),
  }))
    Object.defineProperty(globalThis, key, { configurable: true, value })

  const { editor, review } = setup("review-native-composition")
  const root = document.getElementById("editor")

  if (!root) throw new Error("Missing editor root.")

  let hostVeto = false
  let propagated = 0
  root.addEventListener(
    "beforeinput",
    (event) => {
      if (hostVeto) event.preventDefault()
    },
    true,
  )
  editor.setRootElement(root)
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Keep")))
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  root.addEventListener("beforeinput", () => propagated++, true)

  const commands = new Map<string, number>()

  const releaseParagraph = editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => {
      commands.set(
        "insertParagraph",
        (commands.get("insertParagraph") ?? 0) + 1,
      )

      return true
    },
    COMMAND_PRIORITY_CRITICAL,
  )

  const releaseLineBreak = editor.registerCommand(
    INSERT_LINE_BREAK_COMMAND,
    () => {
      commands.set(
        "insertLineBreak",
        (commands.get("insertLineBreak") ?? 0) + 1,
      )

      return true
    },
    COMMAND_PRIORITY_CRITICAL,
  )

  const releaseDelete = editor.registerCommand(
    DELETE_CHARACTER_COMMAND,
    () => {
      commands.set("delete", (commands.get("delete") ?? 0) + 1)

      return true
    },
    COMMAND_PRIORITY_CRITICAL,
  )

  try {
    const before = JSON.stringify(editor.getEditorState().toJSON())

    for (const [inputType, command] of [
      ["insertParagraph", "insertParagraph"],
      ["insertLineBreak", "insertLineBreak"],
      ["deleteContentBackward", "delete"],
      ["deleteContentForward", "delete"],
    ]) {
      const event = new window.InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType,
        isComposing: true,
      })

      root.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(propagated).toBe(0)
      expect(commands.get(command)).toBeUndefined()
      expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
    }

    hostVeto = true

    const vetoed = new window.InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertParagraph",
      isComposing: true,
    })

    root.dispatchEvent(vetoed)
    expect(vetoed.defaultPrevented).toBe(true)
    expect(propagated).toBe(1)
    expect(commands.size).toBe(0)
    expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  } finally {
    releaseParagraph()
    releaseLineBreak()
    releaseDelete()
    editor.setRootElement(null)
    editor.dispose()

    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})

test("direct break commands do not create suggestions while Lexical composes", () => {
  const { editor, review } = setup("review-native-composition-command")

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Keep")))
      $getRoot().getAllTextNodes()[0]?.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  const before = JSON.stringify(editor.getEditorState().toJSON())

  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes()[0]

      if (!text) throw new Error("Missing composing text.")
      $setCompositionKey(text.getKey())
      expect(editor.isComposing()).toBe(true)
      editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
    },
    { discrete: true },
  )

  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(review.getView().suggestions).toHaveLength(0)
  editor.dispose()
})
