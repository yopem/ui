import { createEditorSelectionBookmark } from "@editor/selection-bookmark"
import { describe, expect, test } from "bun:test"
import {
  $createNodeSelection,
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  createEditor,
} from "lexical"

function setup() {
  const editor = createEditor({
    namespace: "selection-bookmark-test",
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode("original text"))
      $getRoot().append(paragraph)
      paragraph.selectStart()
      getTextNode().select(1, 5)
    },
    { discrete: true },
  )
  const bookmark = createEditorSelectionBookmark(editor)

  return { editor, bookmark }
}

function getParagraph() {
  const node = $getRoot().getFirstChildOrThrow()

  if (!$isElementNode(node)) throw new Error("Expected element node")

  return node
}

function getTextNode() {
  const node = getParagraph().getFirstChildOrThrow()

  if (!$isTextNode(node)) throw new Error("Expected text node")

  return node
}

function expectRange(anchorOffset: number, focusOffset: number) {
  const selection = $getSelection()
  expect($isRangeSelection(selection)).toBe(true)

  if (!$isRangeSelection(selection)) throw new Error("Expected range selection")
  expect(selection.anchor.offset).toBe(anchorOffset)
  expect(selection.focus.offset).toBe(focusOffset)

  return selection
}

describe("editor selection bookmark", () => {
  test("restores independent cloned captures and supports clear", () => {
    const { editor, bookmark } = setup()
    const unsubscribe = bookmark.subscribe(() => undefined)
    expect(bookmark.getSnapshot()).toBe(false)
    expect(bookmark.getServerSnapshot()).toBe(false)
    editor.update(
      () => {
        bookmark.capture()
        const original = expectRange(1, 5)
        original.anchor.set(original.anchor.key, 2, "text")
        original.focus.set(original.focus.key, 4, "text")
        expect(bookmark.restore()).toBe(true)
        const restored = expectRange(1, 5)
        expect(restored).not.toBe(original)
        restored.anchor.set(restored.anchor.key, 3, "text")
        expect(bookmark.restore()).toBe(true)
        expect(expectRange(1, 5)).not.toBe(restored)
        const next = expectRange(1, 5)
        next.anchor.set(next.anchor.key, 2, "text")
        next.focus.set(next.focus.key, 6, "text")
        bookmark.capture()
        expect(bookmark.restore()).toBe(true)
        expectRange(2, 6)
      },
      { discrete: true },
    )
    expect(bookmark.getSnapshot()).toBe(true)
    bookmark.clear()
    expect(bookmark.getSnapshot()).toBe(false)
    editor.update(
      () => {
        const current = $getSelection()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
      },
      { discrete: true },
    )
    unsubscribe()
  })

  test("selection-only updates preserve capture", () => {
    const { editor, bookmark } = setup()
    let notifications = 0

    const unsubscribe = bookmark.subscribe(() => {
      notifications += 1
    })

    editor.update(
      () => {
        bookmark.capture()
      },
      { discrete: true },
    )
    expect(notifications).toBe(1)
    editor.update(
      () => {
        getTextNode().select(6, 8)
      },
      { discrete: true },
    )
    expect(bookmark.getSnapshot()).toBe(true)
    expect(notifications).toBe(1)
    editor.update(
      () => {
        expect(bookmark.restore()).toBe(true)
        expectRange(1, 5)
      },
      { discrete: true },
    )
    unsubscribe()
  })

  test.each(["text", "format"])(
    "%s mutation invalidates retained keys and permits recapture",
    (mutation) => {
      const { editor, bookmark } = setup()
      let notifications = 0

      const unsubscribe = bookmark.subscribe(() => {
        notifications += 1
      })

      let key = ""
      editor.update(
        () => {
          bookmark.capture()
          key = expectRange(1, 5).anchor.key
        },
        { discrete: true },
      )
      editor.update(
        () => {
          const node = getTextNode()

          if (mutation === "text") node.setTextContent("replacement text")
          else node.toggleFormat("bold")
        },
        { discrete: true },
      )
      expect(bookmark.getSnapshot()).toBe(false)
      expect(notifications).toBe(2)
      editor.update(
        () => {
          expect(expectRange(1, 5).anchor.key).toBe(key)
          const current = $getSelection()
          expect(bookmark.restore()).toBe(false)
          expect($getSelection()).toBe(current)
          bookmark.capture()
        },
        { discrete: true },
      )
      expect(bookmark.getSnapshot()).toBe(true)
      editor.update(
        () => {
          expect(bookmark.restore()).toBe(true)
        },
        { discrete: true },
      )
      unsubscribe()
    },
  )

  test("document replacement preserves new selection and rejects deleted keys", () => {
    const { editor, bookmark } = setup()
    const unsubscribe = bookmark.subscribe(() => undefined)
    editor.update(
      () => {
        bookmark.capture()
      },
      { discrete: true },
    )
    editor.update(
      () => {
        $getRoot().clear()
        const replacement = $createTextNode("new document")
        $getRoot().append($createParagraphNode().append(replacement))
        replacement.select(2, 4)
        const current = $getSelection()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
      },
      { discrete: true },
    )
    expect(bookmark.getSnapshot()).toBe(false)
    editor.update(
      () => {
        const current = $getSelection()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
        expectRange(2, 4)
      },
      { discrete: true },
    )
    unsubscribe()
  })

  test("null and node selections clear capture rather than supplying another range", () => {
    const { editor, bookmark } = setup()
    const unsubscribe = bookmark.subscribe(() => undefined)
    editor.update(
      () => {
        bookmark.capture()
        $setSelection(null)
        bookmark.capture()
        expect(bookmark.getSnapshot()).toBe(false)
        const nodeSelection = $createNodeSelection()
        nodeSelection.add($getRoot().getFirstChildOrThrow().getKey())
        $setSelection(nodeSelection)
        bookmark.capture()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(nodeSelection)
      },
      { discrete: true },
    )
    unsubscribe()
  })

  test.each([
    "text",
    "element",
    "detached",
    "wrong-text-type",
    "wrong-element-type",
    "negative",
    "fractional",
    "nonfinite",
  ])(
    "rejects %s points before update commits without changing current selection",
    (invalid) => {
      const { editor, bookmark } = setup()
      const unsubscribe = bookmark.subscribe(() => undefined)
      editor.update(
        () => {
          const paragraph = getParagraph()
          const text = getTextNode()

          if (invalid === "element") paragraph.select(1, 1)
          const selection = $getSelection()

          if (!$isRangeSelection(selection))
            throw new Error("Expected range selection")

          if (invalid === "wrong-text-type")
            selection.anchor.key = paragraph.getKey()

          if (invalid === "wrong-element-type") selection.focus.type = "element"

          if (invalid === "negative")
            selection.anchor.set(text.getKey(), -1, "text")

          if (invalid === "fractional")
            selection.focus.set(text.getKey(), 1.5, "text")

          if (invalid === "nonfinite")
            selection.focus.set(text.getKey(), Number.NaN, "text")
          bookmark.capture()

          if (invalid === "text") text.setTextContent("x")

          if (invalid === "element") paragraph.clear()

          if (invalid === "detached") paragraph.remove()
          const current = $createRangeSelection()
          current.anchor.set("root", 0, "element")
          current.focus.set("root", 0, "element")
          $setSelection(current)
          expect(bookmark.restore()).toBe(false)
          expect($getSelection()).toBe(current)
          expect(bookmark.getSnapshot()).toBe(false)
        },
        { discrete: true },
      )
      unsubscribe()
    },
  )

  test("valid element points restore", () => {
    const { editor, bookmark } = setup()
    const unsubscribe = bookmark.subscribe(() => undefined)
    editor.update(
      () => {
        getParagraph().select(0, 1)
        bookmark.capture()
        $setSelection(null)
        expect(bookmark.restore()).toBe(true)
        expect(expectRange(0, 1).anchor.type).toBe("element")
      },
      { discrete: true },
    )
    unsubscribe()
  })

  test("subscriptions share lifetime; last cleanup clears and stops notifications", () => {
    const { editor, bookmark } = setup()
    editor.update(
      () => {
        bookmark.capture()
      },
      { discrete: true },
    )
    expect(bookmark.getSnapshot()).toBe(false)
    let first = 0
    let second = 0

    const stopFirst = bookmark.subscribe(() => {
      first += 1
    })

    const stopSecond = bookmark.subscribe(() => {
      second += 1
    })

    editor.update(
      () => {
        bookmark.capture()
      },
      { discrete: true },
    )
    expect([first, second]).toEqual([1, 1])
    stopFirst()
    editor.update(
      () => {
        getTextNode().setTextContent("changed text")
      },
      { discrete: true },
    )
    expect([first, second]).toEqual([1, 2])
    editor.update(
      () => {
        bookmark.capture()
      },
      { discrete: true },
    )
    expect([first, second]).toEqual([1, 3])
    stopSecond()
    expect(bookmark.getSnapshot()).toBe(false)
    editor.update(
      () => {
        bookmark.capture()
        getTextNode().setTextContent("later change")
      },
      { discrete: true },
    )
    expect(bookmark.getSnapshot()).toBe(false)
    expect([first, second]).toEqual([1, 3])
    const stopAgain = bookmark.subscribe(() => undefined)
    expect(bookmark.getSnapshot()).toBe(false)
    stopAgain()
  })
})
