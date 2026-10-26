import {
  $createHorizontalRuleNode,
  buildEditorFromExtensions,
  HorizontalRuleExtension,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { MarkNode } from "@lexical/mark"
import { $createQuoteNode, RichTextExtension } from "@lexical/rich-text"
import {
  deriveEditorReviewTreeDiff,
  parseEditorReviewStructural,
} from "@yopem-ui/editor/review"
import {
  createEditorReview,
  editorReviewState,
  editorReviewStructuralState,
} from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getState,
  $isElementNode,
  $nodesOfType,
  $setState,
  HISTORIC_TAG,
  configExtension,
  createState,
  defineExtension,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical"
import { z } from "zod"

function makeReviewEditor(
  controller: ReturnType<typeof createEditorReview>,
  name: string,
) {
  return buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        HorizontalRuleExtension,
        RichTextExtension,
        controller.extension,
      ],
    }),
  )
}

function reviewHost(can: () => boolean = () => true) {
  return {
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can,
  }
}

function makeStructuralFixture(name: string) {
  const controller = createEditorReview()

  const editor = makeReviewEditor(
    controller,
    `review-structural-${name}-source`,
  )

  const target = makeReviewEditor(
    controller,
    `review-structural-${name}-target`,
  )

  const review = controller.forEditor(editor)

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Original")))
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Proposed")))
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)

  return { editor, target, review, id }
}

test("structural decisions reject calls from an active Lexical update", () => {
  const { editor, target, review, id } = makeStructuralFixture("active-update")
  let decision: boolean | undefined

  editor.update(
    () => {
      decision = review.decideStructural(id, "accept")
    },
    { discrete: true },
  )

  expect(decision).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(review.getView().structuralProposals).toHaveLength(1)
  editor.dispose()
  target.dispose()
})

test("structural accept keeps a policy-queued host edit", async () => {
  const { editor, target, review, id } = makeStructuralFixture("policy-pending")

  review.setHost(
    reviewHost(() => {
      editor.update(() => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("Host pending")),
          )
      })

      return true
    }),
  )

  expect(review.decideStructural(id, "accept")).toBe(false)
  editor.read("pending", () =>
    expect($getRoot().getTextContent()).toBe("Host pending"),
  )
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  editor.read(() => expect($getRoot().getTextContent()).toBe("Host pending"))
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.dispose()
  target.dispose()
})

test("structural accept rejects a preexisting pending host edit before policy", async () => {
  const { editor, target, review, id } = makeStructuralFixture(
    "preexisting-pending",
  )

  let policyCalls = 0
  review.setHost(
    reviewHost(() => {
      policyCalls++

      return true
    }),
  )
  editor.update(() => {
    $getRoot()
      .clear()
      .append($createParagraphNode().append($createTextNode("Host pending")))
  })

  expect(review.decideStructural(id, "accept")).toBe(false)
  expect(policyCalls).toBe(0)
  editor.read("pending", () =>
    expect($getRoot().getTextContent()).toBe("Host pending"),
  )
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  editor.read(() => expect($getRoot().getTextContent()).toBe("Host pending"))
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.dispose()
  target.dispose()
})

test("structural accept rejects a discrete policy replacement", () => {
  const { editor, target, review, id } =
    makeStructuralFixture("policy-discrete")

  review.setHost(
    reviewHost(() => {
      editor.update(
        () => {
          $getRoot()
            .clear()
            .append(
              $createParagraphNode().append(
                $createTextNode("Host replacement"),
              ),
            )
        },
        { discrete: true },
      )

      return true
    }),
  )

  expect(review.decideStructural(id, "accept")).toBe(false)
  editor.read(() =>
    expect($getRoot().getTextContent()).toBe("Host replacement"),
  )
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.dispose()
  target.dispose()
})

test("structural reject preserves a proposal replaced during reentrant policy", () => {
  const { editor, target, review, id } = makeStructuralFixture("newer-reject")
  let newerCreatedAt = 0
  let reentrantDecision: boolean | undefined
  let reentered = false

  review.setHost(
    reviewHost(() => {
      if (!reentered) {
        reentered = true
        editor.update(
          () => {
            const active = $getState($getRoot(), editorReviewStructuralState)
              .proposals[0]

            if (!active) return
            newerCreatedAt = active.createdAt + 1
            $setState($getRoot(), editorReviewStructuralState, {
              version: 1,
              proposals: [{ ...active, createdAt: newerCreatedAt }],
            })
          },
          { tag: HISTORIC_TAG, discrete: true },
        )
        reentrantDecision = review.decideStructural(id, "reject")
      }

      return true
    }),
  )

  expect(review.decideStructural(id, "reject")).toBe(false)
  expect(reentrantDecision).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(review.getView().structuralProposals).toHaveLength(1)
  expect(review.getView().structuralProposals[0]?.createdAt).toBe(
    newerCreatedAt,
  )
  editor.dispose()
  target.dispose()
})

test("tree diff reports deterministic insert, remove, move, property, and break changes", () => {
  const before = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          format: "",
          children: [{ type: "text", text: "A" }],
        },
        {
          type: "paragraph",
          format: "",
          children: [{ type: "text", text: "B" }],
        },
        { type: "horizontalrule" },
      ],
    },
  }

  const after = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          format: "",
          children: [{ type: "text", text: "B" }],
        },
        {
          type: "paragraph",
          format: "center",
          children: [{ type: "text", text: "A" }, { type: "linebreak" }],
        },
        {
          type: "paragraph",
          format: "",
          children: [{ type: "text", text: "C" }],
        },
      ],
    },
  }

  const changes = deriveEditorReviewTreeDiff(before, after)
  const kinds = new Set(changes.map((change) => change.kind))

  expect(kinds).toEqual(
    new Set(["insert", "remove", "move", "property", "break"]),
  )
  expect(
    changes
      .filter((change) => change.kind === "remove")
      .some((change) => change.nodeType === "horizontalrule"),
  ).toBe(true)
  expect(deriveEditorReviewTreeDiff(before, after)).toEqual(changes)
})

test("structural proposals accept and reject blocks, properties, breaks, and void removals", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-structural-source")
  const target = makeReviewEditor(controller, "review-structural-target")
  const review = controller.forEditor(editor)

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("First")),
          $createHorizontalRuleNode(),
          $createParagraphNode().append($createTextNode("Second")),
        )
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("Second")),
          $createParagraphNode()
            .setFormat("center")
            .append($createTextNode("First"), $createLineBreakNode()),
          $createParagraphNode().append($createTextNode("Added")),
        )
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  expect(review.getView().structuralProposals[0]?.changes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: "move" }),
      expect.objectContaining({ kind: "property" }),
      expect.objectContaining({ kind: "break" }),
      expect.objectContaining({ kind: "remove", nodeType: "horizontalrule" }),
      expect.objectContaining({ kind: "insert" }),
    ]),
  )
  editor.read(() => expect($getRoot().getTextContent()).toBe("FirstSecond"))
  expect(review.decideStructural(id, "reject")).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("FirstSecond"))
  expect(review.getView().structuralProposals).toHaveLength(0)

  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  expect(review.decideStructural(id, "accept")).toBe(true)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("SecondFirst\nAdded")
    expect($getRoot().getChildren()).toHaveLength(3)
    expect($getRoot().getFirstChild()?.getType()).toBe("paragraph")
  })
  editor.dispose()
  target.dispose()
})

test("structural accept preserves unrelated node state and makes one history step", () => {
  const controller = createEditorReview()

  const editor = makeReviewEditor(
    controller,
    "review-structural-history-source",
  )

  const target = makeReviewEditor(
    controller,
    "review-structural-history-target",
  )

  const review = controller.forEditor(editor)

  const unrelated = createState("review-structural-unrelated", {
    parse(value) {
      return z.string().catch("").parse(value)
    },
  })

  editor.update(
    () => {
      const paragraph = $createParagraphNode().append($createTextNode("Keep"))
      $setState(paragraph, unrelated, "preserved")
      $getRoot().clear().append(paragraph)
    },
    { discrete: true },
  )
  target.update(
    () => {
      const paragraph = $createParagraphNode().append(
        $createTextNode("Keep"),
        $createLineBreakNode(),
        $createTextNode("Added"),
      )

      $setState(paragraph, unrelated, "preserved")
      $getRoot().clear().append(paragraph)
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  expect(review.decideStructural(id, "accept")).toBe(true)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Keep\nAdded")
    expect($getState($getRoot().getFirstChild()!, unrelated)).toBe("preserved")
  })

  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Keep"))
  expect(review.getView().structuralProposals).toHaveLength(1)
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Keep\nAdded"))
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.dispose()
  target.dispose()
})

test("structural proposals support nested Lexical blocks and native history", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-structural-nested-source")
  const target = makeReviewEditor(controller, "review-structural-nested-target")
  const review = controller.forEditor(editor)
  review.setHost(reviewHost())

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createQuoteNode().append(
            $createParagraphNode().append($createTextNode("Original")),
          ),
        )
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createQuoteNode().append(
            $createParagraphNode().append($createTextNode("Nested")),
            $createParagraphNode().append($createTextNode("Added")),
          ),
        )
    },
    { discrete: true },
  )

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  expect(review.decideStructural(id, "accept")).toBe(true)
  editor.read(() => {
    const quote = $getRoot().getFirstChild()
    expect(quote?.getType()).toBe("quote")
    expect(
      $isElementNode(quote)
        ? quote.getChildren().map((child) => child.getTextContent())
        : [],
    ).toEqual(["Nested", "Added"])
  })
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => {
    const quote = $getRoot().getFirstChild()
    const paragraph = $isElementNode(quote) ? quote.getFirstChild() : null
    expect($isElementNode(paragraph) ? paragraph.getTextContent() : null).toBe(
      "Original",
    )
  })
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => {
    const quote = $getRoot().getFirstChild()
    expect(
      $isElementNode(quote)
        ? quote.getChildren().map((child) => child.getTextContent())
        : [],
    ).toEqual(["Nested", "Added"])
  })
  editor.dispose()
  target.dispose()
})

test("structural accept preserves unique comment anchors and source root state", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-structural-anchor-source")
  const target = makeReviewEditor(controller, "review-structural-anchor-target")
  const review = controller.forEditor(editor)

  const authority = createState("review-structural-root-authority", {
    parse(value) {
      return z.string().catch("").parse(value)
    },
  })

  review.setHost(reviewHost())

  let threadId = ""
  editor.update(
    () => {
      const anchor = $createTextNode("Anchor")
      $getRoot().clear().append($createParagraphNode().append(anchor))
      anchor.select(0, 6)
      threadId = review.$createThread("Keep this discussion")
      $setState($getRoot(), authority, "trusted")
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("Anchor")),
          $createParagraphNode().append($createTextNode("Added")),
        )
      $setState($getRoot(), authority, "forged")
      $setState($getRoot(), editorReviewState, {
        version: 1,
        threads: [
          {
            id: "forged-thread",
            resolved: false,
            comments: [
              {
                id: "forged-comment",
                author: { id: "mallory", name: "Mallory" },
                text: "Forged comment",
                createdAt: 1,
                updatedAt: 1,
              },
            ],
          },
        ],
      })
    },
    { discrete: true },
  )

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  expect(review.decideStructural(id, "accept")).toBe(true)
  expect(review.getView().data.threads.map((thread) => thread.id)).toContain(
    threadId,
  )
  expect(
    review.getView().data.threads.map((thread) => thread.id),
  ).not.toContain("forged-thread")
  expect(review.getView().detachedThreadIds).toEqual([])
  editor.read(() => {
    const anchors = $nodesOfType(MarkNode).filter((mark) =>
      mark.hasID(threadId),
    )

    expect(anchors).toHaveLength(1)
    expect(anchors[0]?.getTextContent()).toBe("Anchor")
    expect($getState($getRoot(), authority)).toBe("trusted")
  })
  editor.dispose()
  target.dispose()
})

test("structural accept preserves comment anchors when their blocks move", () => {
  const controller = createEditorReview()

  const editor = makeReviewEditor(
    controller,
    "review-structural-move-anchor-source",
  )

  const target = makeReviewEditor(
    controller,
    "review-structural-move-anchor-target",
  )

  const review = controller.forEditor(editor)
  review.setHost(reviewHost())

  let threadId = ""
  editor.update(
    () => {
      const anchor = $createTextNode("Anchor")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("Before")),
          $createQuoteNode().append($createParagraphNode().append(anchor)),
          $createParagraphNode().append($createTextNode("After")),
        )
      anchor.select(0, 6)
      threadId = review.$createThread("Moved discussion")
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createQuoteNode().append(
            $createParagraphNode().append($createTextNode("Anchor")),
          ),
          $createParagraphNode().append($createTextNode("After")),
          $createParagraphNode().append($createTextNode("Before")),
        )
    },
    { discrete: true },
  )

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  expect(
    review
      .getView()
      .structuralProposals[0]?.changes.some((change) => change.kind === "move"),
  ).toBe(true)
  expect(review.decideStructural(id, "accept")).toBe(true)
  expect(review.getView().detachedThreadIds).toEqual([])
  editor.read(() => {
    const anchor = $nodesOfType(MarkNode).find((mark) => mark.hasID(threadId))
    expect(anchor?.getTextContent()).toBe("Anchor")
    expect(
      anchor?.getTopLevelElementOrThrow().is($getRoot().getFirstChild()),
    ).toBe(true)
  })
  editor.dispose()
  target.dispose()
})

test.each([
  ["removed", ["Replacement"]],
  ["ambiguous", ["Anchor", "Anchor"]],
] as const)(
  "structural accept rejects %s comment anchors without mutation",
  (name, paragraphs) => {
    const controller = createEditorReview()

    const editor = makeReviewEditor(
      controller,
      `review-structural-${name}-anchor-source`,
    )

    const target = makeReviewEditor(
      controller,
      `review-structural-${name}-anchor-target`,
    )

    const review = controller.forEditor(editor)
    review.setHost(reviewHost())

    let threadId = ""
    editor.update(
      () => {
        const anchor = $createTextNode("Anchor")
        $getRoot().clear().append($createParagraphNode().append(anchor))
        anchor.select(0, 6)
        threadId = review.$createThread("Keep this discussion")
      },
      { discrete: true },
    )
    target.update(
      () => {
        $getRoot()
          .clear()
          .append(
            ...paragraphs.map((text) =>
              $createParagraphNode().append($createTextNode(text)),
            ),
          )
      },
      { discrete: true },
    )

    let id = ""
    expect(
      review.run(() => {
        id = review.$suggestDocumentTree(target.getEditorState().toJSON())
      }),
    ).toBe(true)
    expect(review.decideStructural(id, "accept")).toBe(false)
    expect(review.getView().diagnostic).toMatch(/anchor/i)
    expect(review.getView().structuralProposals).toHaveLength(1)
    expect(review.getView().data.threads.map((thread) => thread.id)).toContain(
      threadId,
    )
    editor.read(() => {
      expect($getRoot().getTextContent()).toBe("Anchor")
      expect($nodesOfType(MarkNode).some((mark) => mark.hasID(threadId))).toBe(
        true,
      )
    })
    editor.dispose()
    target.dispose()
  },
)

test("stale host updates invalidate structural proposals without replacing host content", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-structural-stale-source")
  const target = makeReviewEditor(controller, "review-structural-stale-target")
  const review = controller.forEditor(editor)

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Before")))
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Proposal")))
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Host update")))
    },
    { discrete: true, tag: HISTORIC_TAG },
  )

  expect(review.getView().structuralProposals).toHaveLength(0)
  expect(review.decideStructural(id, "accept")).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Host update"))
  editor.dispose()
  target.dispose()
})

test("invalid and oversized structural metadata rejects or strips at untrusted boundaries", () => {
  expect(() =>
    parseEditorReviewStructural({ version: 1, proposals: [{ id: "bad" }] }),
  ).toThrow()
  expect(() =>
    parseEditorReviewStructural({
      version: 1,
      proposals: [
        {
          id: "proposal",
          author: { id: "alice", name: "Alice" },
          createdAt: 1,
          before: { root: { type: "root", children: [] } },
          after: {
            root: {
              type: "root",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "x".repeat(140000) }],
                },
              ],
            },
          },
          precondition: "invalid",
          changes: [],
          anchors: [],
        },
      ],
    }),
  ).toThrow()
})

test("policy revocation, async truthy policies, and read-only state deny structural decisions", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-structural-policy-source")
  const target = makeReviewEditor(controller, "review-structural-policy-target")
  const review = controller.forEditor(editor)

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Original")))
    },
    { discrete: true },
  )
  target.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Changed")))
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestDocumentTree(target.getEditorState().toJSON())
    }),
  ).toBe(true)
  review.setHost(reviewHost(() => false))
  expect(review.decideStructural(id, "accept")).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(review.getView().structuralProposals).toHaveLength(1)

  const asyncPolicy = reviewHost()
  Reflect.set(asyncPolicy, "can", () => Promise.resolve(true))
  review.setHost(asyncPolicy)
  expect(review.decideStructural(id, "accept")).toBe(false)
  editor.setEditable(false)
  review.setHost(reviewHost())
  expect(review.decideStructural(id, "accept")).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
  target.dispose()
})

test("invalid structural targets roll back without replacing the current document", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-structural-invalid")
  const review = controller.forEditor(editor)

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Original")))
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  expect(
    review.run(() => {
      review.$suggestDocumentTree({
        root: {
          type: "root",
          children: [{ type: "unregistered-structural-node", version: 1 }],
        },
      })
    }),
  ).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(review.getView().structuralProposals).toHaveLength(0)
  editor.dispose()
})

test("completed AI text replacements enter the existing inline review flow", () => {
  const controller = createEditorReview()
  const editor = makeReviewEditor(controller, "review-completed-ai-text")
  const review = controller.forEditor(editor)

  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 8)
    },
    { discrete: true },
  )
  review.setHost(reviewHost())

  let id = ""
  editor.update(
    () => {
      id = review.$suggestCompletedText("Completed replacement")
    },
    { discrete: true },
  )
  expect(review.getView().suggestions).toHaveLength(1)
  expect(review.getView().suggestions[0]?.kind).toBe("replace")
  expect(review.run(() => review.$decide(id, "reject"))).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
})
