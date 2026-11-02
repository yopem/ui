import {
  $getPeerDependency,
  buildEditorFromExtensions,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { RichTextExtension } from "@lexical/rich-text"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMPOSITION_END_COMMAND,
  COMPOSITION_START_COMMAND,
  HISTORIC_TAG,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
  configExtension,
  defineExtension,
} from "lexical"
import { parseHTML } from "linkedom"

function fixture() {
  const keys = [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "Node",
    "Event",
    "InputEvent",
    "MutationObserver",
    "getComputedStyle",
  ]

  const previous = new Map(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
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

  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-native-ime-regressions",
      disableEvents: true,
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

  const update = editor.update.bind(editor)
  editor.update = function updateWithModelSelection(callback, options) {
    update(callback, {
      ...options,
      event: options?.event ?? new window.Event("review-model-update"),
    })
  }

  const review = controller.forEditor(editor)
  let policy: (action: string) => boolean = () => true
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: (action) => policy(action),
  })
  const rootElement = document.getElementById("editor")

  if (!rootElement) throw new Error("Missing root.")
  const root = rootElement
  editor.setRootElement(root)
  editor.update(
    () => {
      const text = $createTextNode("Keep")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
  review.setSuggesting(true)
  expect(caret()).toEqual([4, 4])

  function event(type: string, data: string) {
    const value = new window.InputEvent(type, {
      bubbles: true,
      cancelable: true,
      data,
    })

    return Object.assign(value, {
      data,
      initCompositionEvent(
        type: string,
        bubbles?: boolean,
        cancelable?: boolean,
      ) {
        value.initEvent(type, bubbles, cancelable)
      },
    })
  }

  function start() {
    editor.update(
      () => {
        editor.dispatchCommand(
          COMPOSITION_START_COMMAND,
          event("compositionstart", ""),
        )
      },
      { discrete: true },
    )
    expect(editor.isComposing()).toBe(true)
    expect(review.getView().diagnostic).toBe("")
  }

  function draft(data: string) {
    const before = new window.InputEvent("beforeinput", {
      bubbles: true,
      cancelable: false,
      inputType: "insertCompositionText",
      data,
      isComposing: true,
    })

    expect(before.inputType).toBe("insertCompositionText")
    expect(before.data).toBe(data)
    expect(before.isComposing).toBe(true)
    expect(before.cancelable).toBe(false)
    root.dispatchEvent(before)
    expect(before.defaultPrevented).toBe(false)
    editor.update(
      () => {
        const text = $getRoot().getAllTextNodes()[0]
        text.setTextContent(`Keep${data}`)
        text.selectEnd()
      },
      { discrete: true },
    )
    expect(text()).toBe(`Keep${data}`)
    expect(caret()).toEqual([4 + data.length, 4 + data.length])
    expect(review.getView().diagnostic).toBe("")
  }

  function end(data: string) {
    editor.update(
      () => {
        editor.dispatchCommand(
          COMPOSITION_END_COMMAND,
          event("compositionend", data),
        )
      },
      { discrete: true },
    )
  }

  function text() {
    return editor.read(() => $getRoot().getTextContent())
  }

  function depth() {
    return editor.read(
      () =>
        $getPeerDependency<typeof HistoryExtension>(HistoryExtension.name)
          ?.output.historyState.value.undoStack.length,
    )
  }

  function caret() {
    return editor.read(() => {
      const range = $getSelection()

      return $isRangeSelection(range)
        ? [range.anchor.offset, range.focus.offset]
        : null
    })
  }

  function dispose() {
    editor.setRootElement(null)
    editor.dispose()

    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }

  return {
    editor,
    review,
    root,
    event,
    start,
    draft,
    end,
    text,
    depth,
    caret,
    dispose,
    setPolicy(value: typeof policy) {
      policy = value
    },
  }
}

test("host historic append invalidates draft without erasing host content or moving selection", () => {
  const f = fixture()

  try {
    f.start()
    f.draft("語")
    const history = f.depth()
    f.editor.update(
      () => {
        const text = $getRoot().getAllTextNodes()[0]
        text.setTextContent(`${text.getTextContent()}HOST`)
        text.select(1, 2)
      },
      { discrete: true, tag: HISTORIC_TAG },
    )
    f.end("語")
    expect(f.text()).toBe("Keep語HOST")
    expect(f.caret()).toEqual([1, 2])
    expect(f.depth()).toBe(history)
    expect(f.review.getView().suggestions).toHaveLength(0)
  } finally {
    f.dispose()
  }
})

test("untracked host append does not acquire native ownership or erase history", () => {
  const f = fixture()

  try {
    f.start()
    f.draft("語")
    const history = f.depth()
    f.editor.update(
      () => {
        const text = $getRoot().getAllTextNodes()[0]
        text.setTextContent(`${text.getTextContent()}HOST`)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    expect(f.review.getView().diagnostic).toBe(
      "Untracked edits are blocked. Resolve pending suggestions or use review actions.",
    )
    f.end("語")
    expect(f.text()).not.toContain("HOST")
    expect(f.review.getView().suggestions).toHaveLength(0)
    expect(f.depth()).toBe(history)
  } finally {
    f.dispose()
  }
})

test("parsed replacement with new keys discards saved node and range", () => {
  const f = fixture()

  try {
    f.start()
    f.draft("語")

    const replacement = f.editor.parseEditorState({
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "HOST",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
            textFormat: 0,
            textStyle: "",
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    })

    expect(() =>
      f.editor.setEditorState(replacement, { tag: HISTORIC_TAG }),
    ).not.toThrow()
    expect(() => f.end("語")).not.toThrow()
    expect(f.text()).toBe("HOST")
    expect(f.review.getView().suggestions).toHaveLength(0)
  } finally {
    f.dispose()
  }
})

test("selection-only host changes cancel owned draft but never restore old caret", () => {
  const f = fixture()

  try {
    f.start()
    f.draft("語")
    f.editor.update(
      () => {
        $getRoot().getAllTextNodes()[0].select(1, 2)
      },
      { discrete: true },
    )
    f.end("語")
    expect(f.text()).toBe("Keep")
    expect(f.caret()).toEqual([1, 2])
    expect(f.review.getView().suggestions).toHaveLength(0)
  } finally {
    f.dispose()
  }
})

test("composition creation has one undo/redo unit and no draft history", () => {
  const f = fixture()

  try {
    const history = f.depth()
    f.start()
    f.draft("ご")
    f.draft("語")
    expect(f.depth()).toBe(history)
    f.end("語")
    expect(f.text()).toBe("Keep語")
    expect(f.review.getView().suggestions).toHaveLength(1)
    expect(f.depth()).toBe((history ?? 0) + 1)
    f.editor.dispatchCommand(UNDO_COMMAND, undefined)
    expect(f.text()).toBe("Keep")
    expect(f.review.getView().suggestions).toHaveLength(0)
    f.editor.dispatchCommand(REDO_COMMAND, undefined)
    expect(f.text()).toBe("Keep語")
    expect(f.review.getView().suggestions).toHaveLength(1)
  } finally {
    f.dispose()
  }
})

for (const cancel of ["readonly", "policy", "veto"] as const) {
  test(`composition ${cancel} cancellation preserves mode preference without retaining target`, () => {
    const f = fixture()

    try {
      f.start()
      f.draft("語")

      if (cancel === "readonly") f.editor.setEditable(false)

      if (cancel === "policy") f.setPolicy((action) => action !== "suggest")

      if (cancel === "veto") {
        const event = f.event("compositionend", "語")
        event.preventDefault()
        f.editor.update(
          () => {
            f.editor.dispatchCommand(COMPOSITION_END_COMMAND, event)
          },
          { discrete: true },
        )
      } else f.end("語")
      expect(f.text()).toBe("Keep")
      expect(f.review.getView().suggesting).toBe(true)
      expect(f.review.getView().suggestions).toHaveLength(0)
      f.editor.setEditable(true)
      f.setPolicy(() => true)
      f.end("stale")
      expect(f.text()).toBe("Keep")
    } finally {
      f.dispose()
    }
  })
}

for (const order of ["input-first", "end-first"] as const) {
  test(`DOM composition end completes without COMPOSITION_END_COMMAND: ${order}`, async () => {
    const f = fixture()

    try {
      f.start()

      if (order === "input-first") f.draft("語")
      f.root.dispatchEvent(f.event("compositionend", "語"))

      if (order === "end-first") f.draft("語")
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(f.text()).toBe("Keep語")
      expect(f.review.getView().suggestions).toHaveLength(1)
      expect(f.editor.isComposing()).toBe(false)
    } finally {
      f.dispose()
    }
  })
}

for (const mutation of ["mode", "caret", "document", "readonly"] as const) {
  test(`collapsed completion rechecks ${mutation} after authorization`, () => {
    const f = fixture()

    try {
      let armed = true
      f.setPolicy((action) => {
        if (action === "suggest" && armed) {
          armed = false

          if (mutation === "mode") f.review.setSuggesting(false)

          if (mutation === "caret")
            $getRoot().getAllTextNodes()[0].selectStart()

          if (mutation === "document")
            $getRoot().getAllTextNodes()[0].setTextContent("HOST")

          if (mutation === "readonly") f.editor.setEditable(false)
        }

        return true
      })
      f.editor.update(
        () => {
          f.review.$suggestCompletedText("NO")
        },
        { discrete: true },
      )
      expect(armed).toBe(false)
      expect(f.review.getView().diagnostic).toBe(
        mutation === "readonly"
          ? "Review action is read-only or expired."
          : "Completed review insertion target changed during authorization.",
      )
      expect(f.text()).toBe("Keep")
      expect(f.review.getView().suggestions).toHaveLength(0)
    } finally {
      f.dispose()
    }
  })
}

test("coalesced insertion rechecks target after its second authorization", () => {
  const f = fixture()

  try {
    f.editor.update(
      () => {
        f.review.$suggestInsert(" one")
      },
      { discrete: true },
    )
    let calls = 0
    f.setPolicy((action) => {
      if (action === "suggest" && ++calls === 2)
        $getRoot().getAllTextNodes()[0].selectStart()

      return true
    })
    f.editor.update(
      () => {
        f.review.$suggestCompletedText("NO")
      },
      { discrete: true },
    )
    expect(calls).toBe(2)
    expect(f.review.getView().diagnostic).toBe(
      "Completed review insertion target changed during authorization.",
    )
    expect(f.text()).toBe("Keep one")
    expect(f.review.getView().suggestions).toHaveLength(1)
  } finally {
    f.dispose()
  }
})

test("DOM host veto cancels completion without restoring host selection", async () => {
  const f = fixture()

  try {
    f.start()
    f.draft("語")
    f.root.addEventListener("compositionend", (event) => {
      event.preventDefault()
      f.editor.update(
        () => {
          $getRoot().getAllTextNodes()[0].selectStart()
        },
        { discrete: true },
      )
    })
    f.root.dispatchEvent(f.event("compositionend", "語"))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(f.text()).toBe("Keep")
    expect(f.caret()).toEqual([0, 0])
    expect(f.review.getView().suggestions).toHaveLength(0)
  } finally {
    f.dispose()
  }
})

test("explicit insertion and completion helpers remain usable outside suggestion mode", () => {
  const f = fixture()

  try {
    f.review.setSuggesting(false)
    f.editor.update(
      () => {
        f.review.$suggestCompletedText(" one")
      },
      { discrete: true },
    )
    f.editor.update(
      () => {
        f.review.$suggestInsert(" two")
      },
      { discrete: true },
    )
    expect(f.text()).toBe("Keep one two")
    expect(f.review.getView().suggesting).toBe(false)
    expect(f.review.getView().suggestions).toHaveLength(1)
  } finally {
    f.dispose()
  }
})
