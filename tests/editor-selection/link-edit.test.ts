import { EditorAutoLinkExtension } from "@editor/autolink"
import {
  $getEditorLinkEditTarget,
  applyEditorLinkEdit,
} from "@editor/link-edit"
import { createEditorSelectionBookmark } from "@editor/selection-bookmark"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import {
  $createAutoLinkNode,
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  LinkNode,
} from "@lexical/link"
import { RichTextExtension } from "@lexical/rich-text"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
  type NodeKey,
} from "lexical"

function createEditor() {
  return buildEditorFromExtensions({
    name: "test/editor-link-edit",
    dependencies: [
      HeadlessExtension,
      RichTextExtension,
      EditorAutoLinkExtension,
    ],
  })
}

function setup(kind: "link" | "autolink", rel = "nofollow") {
  const editor = createEditor()
  const bookmark = createEditorSelectionBookmark(editor)
  const unsubscribe = bookmark.subscribe(() => undefined)
  let linkKey: NodeKey = ""
  let boldTextKey: NodeKey = ""
  let childKeys: NodeKey[] = []

  editor.update(
    () => {
      const boldText = $createTextNode(
        kind === "autolink" ? "https://old." : "Original ",
      ).toggleFormat("bold")

      const plainText = $createTextNode(
        kind === "autolink" ? "example" : "label",
      )

      const link =
        kind === "autolink"
          ? $createAutoLinkNode("https://old.example", {
              target: "_blank",
              rel,
            })
          : $createLinkNode("https://old.example", {
              target: "_blank",
              rel,
            })

      link.append(boldText, plainText)
      $getRoot().append($createParagraphNode().append(link))
      boldText.select(2, 4)
      bookmark.capture()
      linkKey = link.getKey()
      boldTextKey = boldText.getKey()
      childKeys = link.getChildren().map((child) => child.getKey())
    },
    { discrete: true },
  )

  const target = captureTarget(editor, bookmark)

  if (!target) throw new Error("Expected a selected link target.")

  return {
    editor,
    bookmark,
    unsubscribe,
    target,
    linkKey,
    boldTextKey,
    childKeys,
  }
}

function expectCurrentRange(
  anchorKey: NodeKey,
  anchorOffset: number,
  focusOffset: number,
) {
  const selection = $getSelection()
  expect($isRangeSelection(selection)).toBe(true)

  if (!$isRangeSelection(selection))
    throw new Error("Expected range selection.")
  expect(selection.anchor.key).toBe(anchorKey)
  expect(selection.anchor.offset).toBe(anchorOffset)
  expect(selection.focus.key).toBe(anchorKey)
  expect(selection.focus.offset).toBe(focusOffset)
}

function captureTarget(
  editor: ReturnType<typeof createEditor>,
  bookmark: ReturnType<typeof createEditorSelectionBookmark>,
) {
  return editor.getEditorState().read(() => {
    bookmark.capture()

    return $getEditorLinkEditTarget()
  })
}

describe("editor link editing", () => {
  test.each(["link", "autolink"] as const)(
    "inspects and updates a partially selected %s without replacing children",
    (kind) => {
      const {
        editor,
        bookmark,
        unsubscribe,
        target,
        linkKey,
        boldTextKey,
        childKeys,
      } = setup(kind, "nofollow Opener")

      try {
        expect(target).toEqual({
          linkKey,
          url: "https://old.example",
          text: kind === "autolink" ? "https://old.example" : "Original label",
          newTab: true,
        })
        expect(
          applyEditorLinkEdit(editor, bookmark, target, {
            url: "https://new.example",
            text: target.text,
            newTab: true,
          }),
        ).toBe(true)

        editor.getEditorState().read(() => {
          const link = $nodesOfType(LinkNode)[0]
          expect($isLinkNode(link)).toBe(true)

          if (!$isLinkNode(link)) throw new Error("Expected a link node.")
          expect($isAutoLinkNode(link)).toBe(false)
          expect(link.getURL()).toBe("https://new.example")
          expect(link.getTarget()).toBe("_blank")
          expect(link.getRel()).toContain("nofollow")
          expect(link.getRel()).toContain("noopener")
          expect(link.getRel()).toContain("noreferrer")
          expect(
            link
              .getRel()
              ?.split(/\s+/)
              .map((token) => token.toLowerCase()),
          ).not.toContain("opener")
          expect(link.getChildren().map((child) => child.getKey())).toEqual(
            childKeys,
          )
          expectCurrentRange(boldTextKey, 2, 4)
        })
      } finally {
        unsubscribe()
        editor.dispose()
      }
    },
  )

  test("replaces link children only when text changes", () => {
    const { editor, bookmark, unsubscribe, target, linkKey } = setup("link")

    try {
      expect(
        applyEditorLinkEdit(editor, bookmark, target, {
          url: "https://updated.example",
          text: "Updated label",
          newTab: false,
        }),
      ).toBe(true)

      editor.getEditorState().read(() => {
        const link = $getNodeByKey(linkKey)
        expect($isLinkNode(link)).toBe(true)

        if (!$isLinkNode(link)) throw new Error("Expected a link node.")
        expect(link.getTextContent()).toBe("Updated label")
        expect(link.getChildren()).toHaveLength(1)
        expect(link.getTarget()).toBeNull()
      })
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })

  test("rejects unsafe input, stale bookmarks, and read-only editors without changing selection", () => {
    const unsafe = setup("link")

    try {
      expect(
        applyEditorLinkEdit(unsafe.editor, unsafe.bookmark, unsafe.target, {
          url: "javascript:alert(1)",
          text: unsafe.target.text,
          newTab: false,
        }),
      ).toBe(false)
      unsafe.editor.getEditorState().read(() => {
        const link = $getNodeByKey(unsafe.linkKey)

        if (!$isLinkNode(link)) throw new Error("Expected a link node.")
        expect(link.getURL()).toBe("https://old.example")
        expectCurrentRange(unsafe.boldTextKey, 2, 4)
      })
    } finally {
      unsafe.unsubscribe()
      unsafe.editor.dispose()
    }

    const stale = setup("link")
    let unrelatedKey: NodeKey = ""

    try {
      stale.editor.update(
        () => {
          const unrelated = $createTextNode("Unrelated text")
          $getRoot().append($createParagraphNode().append(unrelated))
          unrelated.select(2, 5)
          unrelatedKey = unrelated.getKey()
        },
        { discrete: true },
      )
      expect(stale.bookmark.getSnapshot()).toBe(false)
      expect(
        applyEditorLinkEdit(stale.editor, stale.bookmark, stale.target, {
          url: "https://new.example",
          text: stale.target.text,
          newTab: false,
        }),
      ).toBe(false)
      stale.editor.getEditorState().read(() => {
        const link = $getNodeByKey(stale.linkKey)

        if (!$isLinkNode(link)) throw new Error("Expected a link node.")
        expect(link.getURL()).toBe("https://old.example")
        expectCurrentRange(unrelatedKey, 2, 5)
      })
    } finally {
      stale.unsubscribe()
      stale.editor.dispose()
    }

    const readOnly = setup("link")

    try {
      readOnly.editor.setEditable(false)
      expect(
        applyEditorLinkEdit(
          readOnly.editor,
          readOnly.bookmark,
          readOnly.target,
          {
            url: "https://new.example",
            text: readOnly.target.text,
            newTab: false,
          },
        ),
      ).toBe(false)
      readOnly.editor.getEditorState().read(() => {
        const link = $getNodeByKey(readOnly.linkKey)

        if (!$isLinkNode(link)) throw new Error("Expected a link node.")
        expect(link.getURL()).toBe("https://old.example")
        expectCurrentRange(readOnly.boldTextKey, 2, 4)
      })
    } finally {
      readOnly.unsubscribe()
      readOnly.editor.dispose()
    }
  })

  test.each(["pending", "active"] as const)(
    "rejects link edits during %s host updates",
    (phase) => {
      const { editor, bookmark, unsubscribe, target, linkKey } = setup("link")

      const edit = {
        url: "https://new.example",
        text: target.text,
        newTab: false,
      }

      try {
        if (phase === "active") {
          editor.update(
            () => {
              expect(applyEditorLinkEdit(editor, bookmark, target, edit)).toBe(
                false,
              )
            },
            { discrete: true },
          )
        } else {
          editor.update(() => {
            $getRoot().append(
              $createParagraphNode().append($createTextNode("Host change")),
            )
          })
          expect(applyEditorLinkEdit(editor, bookmark, target, edit)).toBe(
            false,
          )
          editor.update(
            () => {
              $getRoot().selectEnd()
            },
            { discrete: true },
          )
        }

        editor.getEditorState().read(() => {
          const link = $getNodeByKey(linkKey)

          if (!$isLinkNode(link)) throw new Error("Expected the original link.")
          expect(link.getURL()).toBe("https://old.example")
        })
      } finally {
        unsubscribe()
        editor.dispose()
      }
    },
  )

  test("opens a new link from changed selected text", () => {
    const editor = createEditor()
    const bookmark = createEditorSelectionBookmark(editor)
    const unsubscribe = bookmark.subscribe(() => undefined)

    try {
      editor.update(
        () => {
          const text = $createTextNode("Selected phrase")
          $getRoot().append($createParagraphNode().append(text))
          text.select(0, text.getTextContentSize())
          bookmark.capture()
        },
        { discrete: true },
      )

      const target = captureTarget(editor, bookmark)

      if (!target) throw new Error("Expected a selected text range.")
      expect(target.linkKey).toBeNull()
      expect(target.text).toBe("Selected phrase")
      expect(
        applyEditorLinkEdit(editor, bookmark, target, {
          url: "https://new.example",
          text: "New phrase",
          newTab: true,
        }),
      ).toBe(true)
      editor.getEditorState().read(() => {
        const link = $nodesOfType(LinkNode)[0]
        expect($isLinkNode(link)).toBe(true)

        if (!$isLinkNode(link)) throw new Error("Expected a link node.")
        expect(link.getURL()).toBe("https://new.example")
        expect(link.getTextContent()).toBe("New phrase")
        expect(link.getTarget()).toBe("_blank")
        expect(link.getRel()).toContain("noopener")
        expect(link.getRel()).toContain("noreferrer")
      })
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })

  test("captures the current target when reopened after an edit", () => {
    const { editor, bookmark, unsubscribe, target } = setup("autolink")

    try {
      expect(
        applyEditorLinkEdit(editor, bookmark, target, {
          url: "https://new.example",
          text: target.text,
          newTab: false,
        }),
      ).toBe(true)
      editor.update(
        () => {
          const nextTarget = $getEditorLinkEditTarget()
          expect(nextTarget?.url).toBe("https://new.example")
          expect(nextTarget?.newTab).toBe(false)
        },
        { discrete: true },
      )
      expect(captureTarget(editor, bookmark)?.url).toBe("https://new.example")
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })
})
