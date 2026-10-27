import {
  $getPeerDependency,
  buildEditorFromExtensions,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import {
  $createListItemNode,
  $createListNode,
  ListExtension,
} from "@lexical/list"
import { MarkExtension } from "@lexical/mark"
import { RichTextExtension } from "@lexical/rich-text"
import {
  createEditorReview,
  editorReviewState,
  editorSuggestionState,
} from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $setState,
  $isTextNode,
  INSERT_PARAGRAPH_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  configExtension,
  defineExtension,
  type LexicalEditor,
  type LexicalNode,
} from "lexical"

function makeEditor(name: string) {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        ListExtension,
        RichTextExtension,
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  return { editor, review: controller.forEditor(editor), controller }
}

function makePlainEditor(name: string) {
  return buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        ListExtension,
        MarkExtension,
        RichTextExtension,
      ],
      onError(error) {
        throw error
      },
    }),
  )
}

function setHost(
  review: ReturnType<typeof makeEditor>["review"],
  can: (action: string) => boolean = () => true,
) {
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: (action) => can(action),
  })
}

function makeFixture(
  editor: LexicalEditor,
  review: ReturnType<typeof makeEditor>["review"],
  withComment = false,
) {
  let threadId: string | undefined

  editor.update(
    () => {
      const anchor = $createTextNode("Anchor")
      $getRoot().clear().append($createParagraphNode().append(anchor))

      if (withComment) {
        anchor.select(0, anchor.getTextContentSize())
        threadId = review.$createThread("Keep this anchor")
      }

      $getRoot().selectEnd()
    },
    { discrete: true },
  )

  return threadId
}

function historyDepth(editor: LexicalEditor) {
  return editor.read(
    () =>
      $getPeerDependency<typeof HistoryExtension>(HistoryExtension.name)?.output
        .historyState.value.undoStack.length ?? -1,
  )
}

function paragraph(text: string) {
  return $createParagraphNode().append($createTextNode(text))
}

function insertion(text: string) {
  return () => {
    const node = paragraph(text)
    $insertNodes([node])

    return [node]
  }
}

function runInsert(
  editor: LexicalEditor,
  review: ReturnType<typeof makeEditor>["review"],
  insert: () => readonly LexicalNode[],
) {
  let id: string | undefined

  try {
    editor.update(
      () => {
        const root = $getRoot()
        root.select(root.getChildrenSize(), root.getChildrenSize())
        id = review.$suggestNativeInsertNodes(insert)
      },
      { discrete: true },
    )
  } catch {
    return undefined
  }

  return id
}

function expectUnchanged(
  editor: LexicalEditor,
  review: ReturnType<typeof makeEditor>["review"],
  before: string,
  depth: number,
) {
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(historyDepth(editor)).toBe(depth)
  expect(review.getView().suggestions).toHaveLength(0)
  expect(review.getView().diagnostic.length).toBeGreaterThan(0)
}

test("native node insertion tracks nested text and keeps accept history after reload", () => {
  const { editor, review } = makeEditor("review-native-insert-accept")
  setHost(review)
  const threadId = makeFixture(editor, review, true)
  const beforeDepth = historyDepth(editor)
  review.setSuggesting(true)

  const id = runInsert(editor, review, () => {
    const paragraphNode = paragraph("Inserted")

    const list = $createListNode("bullet").append(
      $createListItemNode().append(
        $createTextNode("First item"),
        $createListNode("number").append(
          $createListItemNode().append($createTextNode("Nested item")),
        ),
      ),
    )

    const nodes = [paragraphNode, list]
    $insertNodes(nodes)

    return nodes
  })

  expect(id).toBeDefined()

  if (!id || !threadId)
    throw new Error("Expected tracked insertion and anchor.")
  expect(historyDepth(editor)).toBe(beforeDepth + 1)
  expect(review.getView().suggestions).toHaveLength(1)
  expect(review.getView().suggestions[0]?.id).toBe(id)
  expect(review.getView().suggestions[0]?.author).toEqual({
    id: "alice",
    name: "Alice",
  })
  expect(review.getView().suggestions[0]?.kind).toBe("insert")
  expect(review.getView().suggestions[0]?.insertedText).toContain("Inserted")
  expect(review.getView().suggestions[0]?.insertedText).toContain("Nested item")
  expect(review.getView().detachedThreadIds).toEqual([])
  editor.read(() => {
    expect($getRoot().getTextContent()).toContain("Inserted")
    expect($getRoot().getTextContent()).toContain("First item")
    expect($getRoot().getTextContent()).toContain("Nested item")
  })

  const saved = JSON.stringify(editor.getEditorState().toJSON())
  const reloadedEditor = makePlainEditor("review-native-insert-accept-reload")
  reloadedEditor.setEditorState(reloadedEditor.parseEditorState(saved))
  const reloadedController = createEditorReview()
  const disconnect = reloadedController.register(reloadedEditor)
  const reloadedReview = reloadedController.forEditor(reloadedEditor)
  setHost(reloadedReview)
  const reloadedDepth = historyDepth(reloadedEditor)

  expect(reloadedReview.run(() => reloadedReview.$decide(id, "accept"))).toBe(
    true,
  )
  expect(historyDepth(reloadedEditor)).toBe(reloadedDepth + 1)
  expect(reloadedReview.getView().suggestions).toHaveLength(0)
  expect(
    reloadedReview.getView().data.threads.map((thread) => thread.id),
  ).toContain(threadId)
  reloadedEditor.read(() => {
    expect($getRoot().getTextContent()).toContain("Inserted")
    expect($getRoot().getTextContent()).toContain("Nested item")
  })
  expect(reloadedEditor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(true)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toContain("Nested item"),
  )
  expect(reloadedReview.getView().suggestions.map((item) => item.id)).toEqual([
    id,
  ])
  reloadedEditor.dispatchCommand(REDO_COMMAND, undefined)
  reloadedEditor.read(() =>
    expect($getRoot().getTextContent()).toContain("Nested item"),
  )
  expect(reloadedReview.getView().suggestions).toHaveLength(0)

  editor.dispose()
  disconnect()
  reloadedEditor.dispose()
})

test("native node rejection restores comment anchors and remains one history step", () => {
  const { editor, review } = makeEditor("review-native-insert-reject")
  setHost(review)
  const threadId = makeFixture(editor, review, true)
  const beforeDepth = historyDepth(editor)
  review.setSuggesting(true)

  const id = runInsert(editor, review, insertion("Rejected"))

  expect(id).toBeDefined()

  if (!id || !threadId)
    throw new Error("Expected tracked insertion and anchor.")
  expect(historyDepth(editor)).toBe(beforeDepth + 1)
  expect(review.run(() => review.$decide(id, "reject"))).toBe(true)
  expect(historyDepth(editor)).toBe(beforeDepth + 2)
  expect(review.getView().suggestions).toHaveLength(0)
  expect(review.getView().data.threads.map((thread) => thread.id)).toContain(
    threadId,
  )
  expect(review.getView().detachedThreadIds).toEqual([])
  editor.read(() => expect($getRoot().getTextContent()).toBe("Anchor"))

  expect(editor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toContain("Rejected"))
  expect(review.getView().suggestions.map((item) => item.id)).toEqual([id])
  editor.read(() => expect($getRoot().getTextContent()).toContain("Rejected"))
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Anchor"))
  expect(review.getView().suggestions).toHaveLength(0)

  editor.dispose()
})

test("native node insertion requires current literal permission and owning editable editor", () => {
  const { editor, review } = makeEditor("review-native-insert-policy")
  setHost(review)
  makeFixture(editor, review)
  const before = JSON.stringify(editor.getEditorState().toJSON())
  const depth = historyDepth(editor)
  let called = false

  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Mode off")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expectUnchanged(editor, review, before, depth)

  review.setSuggesting(true)
  setHost(review, (action) => action !== "suggest")
  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Denied")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expectUnchanged(editor, review, before, depth)

  const strictHost = new Proxy(
    {
      viewer: { id: "alice", name: "Alice" },
      visible: true,
      replyWhileReadonly: false,
      can: () => true,
    },
    {
      get(target, property) {
        if (property === "can") return () => "truthy"

        if (property === "viewer") return target.viewer

        if (property === "visible") return target.visible

        if (property === "replyWhileReadonly") return target.replyWhileReadonly

        return undefined
      },
    },
  )

  review.setHost(strictHost)
  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Truthy")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expectUnchanged(editor, review, before, depth)

  editor.setEditable(false)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Readonly")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  editor.setEditable(true)

  const otherEditor = makePlainEditor("review-native-insert-wrong-editor")

  expect(() =>
    otherEditor.update(
      () => {
        $getRoot().selectEnd()
        review.$suggestNativeInsertNodes(() => {
          called = true

          return insertion("Wrong editor")()
        })
      },
      { discrete: true },
    ),
  ).toThrow()
  expect(called).toBe(false)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  otherEditor.dispose()
  editor.dispose()
})

test("native node insertion rejects reentrant authorization and keeps replacement host", () => {
  const { editor, review } = makeEditor("review-native-insert-reentrant")
  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)
  const before = JSON.stringify(editor.getEditorState().toJSON())
  const depth = historyDepth(editor)
  let called = false
  let reenter = true

  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => {
      if (reenter) {
        reenter = false
        review.setHost({
          viewer: { id: "bob", name: "Bob" },
          visible: true,
          replyWhileReadonly: false,
          can: () => true,
        })
      }

      return true
    },
  })

  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Reentrant")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expectUnchanged(editor, review, before, depth)
  expect(
    review.run(() => {
      $getRoot().getAllTextNodes()[0]?.selectEnd()

      return review.$suggestInsert("Host remains active")
    }),
  ).toBe(true)
  expect(review.getView().suggestions[0]?.author.id).toBe("bob")
  editor.dispose()
})

test("native node insertion rejects selection changes during authorization", () => {
  const { editor, review } = makeEditor("review-native-insert-selection")
  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)
  const before = JSON.stringify(editor.getEditorState().toJSON())
  const depth = historyDepth(editor)
  let called = false

  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => {
      $getRoot().getAllTextNodes()[0]?.selectStart()

      return true
    },
  })

  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Stale selection")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expectUnchanged(editor, review, before, depth)
  editor.dispose()
})

test("native node insertion rolls back throws, thenables, no-ops, and scope changes", () => {
  const { editor, review } = makeEditor("review-native-insert-failures")
  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)

  const cases: (() => readonly LexicalNode[])[] = [
    () => {
      const node = paragraph("Throw")
      $insertNodes([node])
      throw new Error("stop")
    },
    () => {
      const nodes = [paragraph("Async")]
      $insertNodes(nodes)

      // oxlint-disable-next-line unicorn/no-thenable -- Test rejection of thenable callback results.
      return Object.assign(nodes, { then: () => undefined })
    },
    () => [],
    () => {
      const node = paragraph("First")
      $insertNodes([node, paragraph("Extra")])

      return [node]
    },
    () => {
      const node = paragraph("Replacement")
      $getRoot().clear()
      $insertNodes([node])

      return [node]
    },
    () => {
      const node = paragraph("Outer")
      $insertNodes([node])
      review.$suggestNativeInsertNodes(insertion("Nested"))

      return [node]
    },
  ]

  for (const insert of cases) {
    const before = JSON.stringify(editor.getEditorState().toJSON())
    const depth = historyDepth(editor)

    expect(runInsert(editor, review, insert)).toBeUndefined()
    expectUnchanged(editor, review, before, depth)
  }

  editor.dispose()
})

test("native node insertion rejects mutation after the wrapper", () => {
  const { editor, review } = makeEditor("review-native-insert-post-mutation")
  setHost(review)
  makeFixture(editor, review, true)
  review.setSuggesting(true)

  const mutations = [
    () => $getRoot().append(paragraph("Extra")),
    () => $getRoot().getFirstChild()?.remove(),
    () => $getRoot().getAllTextNodes()[0]?.setTextContent("Changed anchor"),
  ]

  for (const mutate of mutations) {
    const before = JSON.stringify(editor.getEditorState().toJSON())
    const depth = historyDepth(editor)

    try {
      editor.update(
        () => {
          const root = $getRoot()
          root.select(root.getChildrenSize(), root.getChildrenSize())
          review.$suggestNativeInsertNodes(insertion("Tracked"))
          mutate()
        },
        { discrete: true },
      )
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }

    expectUnchanged(editor, review, before, depth)
  }

  editor.dispose()
})

test("native node insertion rejects unsupported, oversized, forged, and ambiguous nodes", () => {
  const { editor, review } = makeEditor("review-native-insert-validation")
  setHost(review)
  const threadId = makeFixture(editor, review, true)

  if (!threadId) throw new Error("Expected an anchor thread.")
  review.setSuggesting(true)

  const callbacks: (() => readonly LexicalNode[])[] = [
    () => {
      const node = paragraph("Manual append")
      $getRoot().append(node)

      return [node]
    },
    () => {
      const lineBreak = $createLineBreakNode()
      $insertNodes([lineBreak])

      return [lineBreak]
    },
    () => {
      const node = paragraph("x".repeat(140000))
      $insertNodes([node])

      return [node]
    },
    () => {
      const node = paragraph("Forged")
      const text = node.getFirstChild()

      if (!$isTextNode(text)) throw new Error("Expected a text node.")
      $insertNodes([node])
      $setState(text, editorSuggestionState, {
        id: "forged",
        author: { id: "mallory", name: "Mallory" },
        createdAt: 1,
        kind: "insert" as const,
        beforeFormat: 0,
      })

      return [node]
    },
    () => {
      $setState($getRoot(), editorReviewState, {
        version: 1,
        threads: [
          {
            id: "forged",
            resolved: false,
            comments: [
              {
                id: "forged-comment",
                author: { id: "mallory", name: "Mallory" },
                text: "Forged authority",
                createdAt: 1,
                updatedAt: 1,
              },
            ],
          },
        ],
      })
      const node = paragraph("Authority")
      $insertNodes([node])

      return [node]
    },
    () => {
      $setState($getRoot(), editorReviewState, { version: 1, threads: [] })
      const node = paragraph("Removed authority")
      $insertNodes([node])

      return [node]
    },
    () => {
      const node = paragraph("Anchor")
      $insertNodes([node])

      return [node]
    },
    () => {
      $getRoot().getFirstChild()?.remove()
      const node = paragraph("Lost anchor")
      $insertNodes([node])

      return [node]
    },
    () => {
      let item = $createListItemNode().append($createTextNode("Deep"))
      const list = $createListNode("bullet").append(item)

      for (let index = 0; index < 15; index++) {
        const nested = $createListNode("bullet")
        const nextItem = $createListItemNode().append($createTextNode("Deep"))
        item.append(nested)
        nested.append(nextItem)
        item = nextItem
      }

      $insertNodes([list])

      return [list]
    },
  ]

  for (const insert of callbacks) {
    const before = JSON.stringify(editor.getEditorState().toJSON())
    const depth = historyDepth(editor)

    expect(runInsert(editor, review, insert)).toBeUndefined()
    expectUnchanged(editor, review, before, depth)
  }

  expect(review.getView().data.threads.map((thread) => thread.id)).toContain(
    threadId,
  )
  editor.dispose()
})

test("native node insertion guard keeps existing pending and structural behavior", () => {
  const { editor, review } = makeEditor("review-native-insert-guards")
  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)

  const before = JSON.stringify(editor.getEditorState().toJSON())
  let called = false

  editor.update(
    () => {
      $getRoot().selectEnd()
      $insertNodes([paragraph("Untracked")])
    },
    { discrete: true },
  )
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(review.getView().suggestions).toHaveLength(0)

  const target = makePlainEditor("review-native-insert-structural-target")
  target.update(
    () => {
      $getRoot().clear().append(paragraph("Proposed"))
    },
    { discrete: true },
  )

  expect(
    review.run(() =>
      review.$suggestDocumentTree(target.getEditorState().toJSON()),
    ),
  ).toBe(false)
  expect(review.getView().structuralProposals).toHaveLength(0)
  expect(
    review.run(() => {
      $getRoot().getAllTextNodes()[0]?.selectEnd()

      return review.$suggestInsert("Pending inline")
    }),
  ).toBe(true)
  const inlinePending = JSON.stringify(editor.getEditorState().toJSON())
  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Blocked inline")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(inlinePending)

  editor.dispose()
  target.dispose()
})

test("native node insertion rejects any pending review kind and preserves stale proposal replacement", () => {
  const { editor, review } = makeEditor("review-native-insert-pending")
  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)

  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0]?.selectEnd()
      editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
    },
    { discrete: true },
  )
  expect(review.getView().suggestions.length).toBeGreaterThan(0)
  let called = false
  const beforeBreak = JSON.stringify(editor.getEditorState().toJSON())
  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Blocked break")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(beforeBreak)

  const structuralEditor = makeEditor("review-native-insert-structural")
  setHost(structuralEditor.review)
  makeFixture(structuralEditor.editor, structuralEditor.review)
  const target = makePlainEditor("review-native-insert-structural-proposal")
  target.update(
    () => {
      $getRoot().clear().append(paragraph("Proposed"))
    },
    { discrete: true },
  )
  expect(
    structuralEditor.review.run(() =>
      structuralEditor.review.$suggestDocumentTree(
        target.getEditorState().toJSON(),
      ),
    ),
  ).toBe(true)

  const structuralBefore = JSON.stringify(
    structuralEditor.editor.getEditorState().toJSON(),
  )

  expect(
    runInsert(structuralEditor.editor, structuralEditor.review, () => {
      called = true

      return insertion("Blocked structural")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expect(
    JSON.stringify(structuralEditor.editor.getEditorState().toJSON()),
  ).toBe(structuralBefore)

  structuralEditor.editor.update(
    () => {
      $getRoot().clear().append(paragraph("Host replacement"))
    },
    { discrete: true },
  )
  structuralEditor.editor.read(() =>
    expect($getRoot().getTextContent()).toBe("Host replacement"),
  )
  expect(structuralEditor.review.getView().structuralProposals).toHaveLength(0)

  editor.dispose()
  structuralEditor.editor.dispose()
  target.dispose()
})

test("native node insertion rejects a second operation while native state is pending", () => {
  const { editor, review } = makeEditor("review-native-insert-pending-native")
  setHost(review)
  makeFixture(editor, review)
  review.setSuggesting(true)

  const id = runInsert(editor, review, insertion("First insertion"))

  expect(id).toBeDefined()

  if (!id) throw new Error("Expected a native suggestion.")
  const before = JSON.stringify(editor.getEditorState().toJSON())
  const depth = historyDepth(editor)
  let called = false

  expect(
    runInsert(editor, review, () => {
      called = true

      return insertion("Second insertion")()
    }),
  ).toBeUndefined()
  expect(called).toBe(false)
  expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
  expect(historyDepth(editor)).toBe(depth)
  expect(review.getView().suggestions.map((item) => item.id)).toEqual([id])

  editor.dispose()
})
