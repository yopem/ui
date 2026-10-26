import { EditorAutoLinkExtension } from "@editor/autolink"
import { $createCodeNode } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import { $isAutoLinkNode, AutoLinkNode } from "@lexical/link"
import { RichTextExtension } from "@lexical/rich-text"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  $nodesOfType,
  UNDO_COMMAND,
} from "lexical"

function createEditor() {
  return buildEditorFromExtensions({
    name: "test/editor-autolink",
    dependencies: [
      HeadlessExtension,
      RichTextExtension,
      EditorAutoLinkExtension,
    ],
  })
}

describe("native automatic links", () => {
  test("matches URLs and email addresses without changing visible text", () => {
    const editor = createEditor()
    const text = "Visit https://example.com/path and write person@example.com."

    try {
      editor.update(
        () => {
          $getRoot()
            .clear()
            .append($createParagraphNode().append($createTextNode(text)))
        },
        { discrete: true },
      )
      editor.getEditorState().read(() => {
        expect($getRoot().getTextContent()).toBe(text)
        expect($nodesOfType(AutoLinkNode).map((node) => node.getURL())).toEqual(
          ["https://example.com/path", "mailto:person@example.com"],
        )
      })
    } finally {
      editor.dispose()
    }
  })

  test("updates native automatic URLs and retains explicit unlink state", () => {
    const editor = createEditor()

    try {
      editor.update(
        () => {
          $getRoot()
            .clear()
            .append(
              $createParagraphNode().append(
                $createTextNode("https://example.com"),
              ),
            )
        },
        { discrete: true },
      )
      editor.update(
        () => {
          const link = $nodesOfType(AutoLinkNode)[0]
          const text = link?.getFirstChild()

          if (!$isTextNode(text) || !link)
            throw new Error("Automatic link was not created.")
          text.setTextContent("https://example.org")
        },
        { discrete: true },
      )
      editor.getEditorState().read(() => {
        expect($nodesOfType(AutoLinkNode)[0]?.getURL()).toBe(
          "https://example.org",
        )
      })
      editor.update(
        () => {
          $nodesOfType(AutoLinkNode)[0]?.setIsUnlinked(true)
        },
        { discrete: true },
      )
      editor.update(
        () => {
          $getRoot().append(
            $createParagraphNode().append($createTextNode("Unrelated edit")),
          )
        },
        { discrete: true },
      )
      editor.getEditorState().read(() => {
        expect($nodesOfType(AutoLinkNode)[0]?.getIsUnlinked()).toBe(true)
      })
    } finally {
      editor.dispose()
    }
  })

  test("formatting an automatic link as inline code is preserved and undoable", () => {
    const editor = createEditor()
    const history = registerHistory(editor, createEmptyHistoryState(), 300)

    try {
      editor.update(
        () => {
          $getRoot()
            .clear()
            .append(
              $createParagraphNode().append(
                $createTextNode("https://example.com"),
              ),
            )
        },
        { discrete: true },
      )
      editor.update(
        () => {
          const link = $nodesOfType(AutoLinkNode)[0]
          const text = link?.getFirstChild()

          if (!$isTextNode(text) || !link)
            throw new Error("Automatic link was not created.")
          link.setRel("noreferrer")
          link.setTarget("_blank")
          link.setTitle("Example")
          text.toggleFormat("bold")
          text.setStyle("color: red")
        },
        { discrete: true },
      )
      editor.update(
        () => {
          const link = $nodesOfType(AutoLinkNode)[0]
          const text = link?.getFirstChild()

          if (!$isTextNode(text) || !link)
            throw new Error("Automatic link was not created.")
          text.toggleFormat("code")
        },
        { discrete: true },
      )
      editor.getEditorState().read(() => {
        const link = $nodesOfType(AutoLinkNode)[0]
        const text = link?.getFirstChild()

        expect(link?.getIsUnlinked()).toBe(true)
        expect(link?.getURL()).toBe("https://example.com")
        expect(link?.getRel()).toBe("noreferrer")
        expect(link?.getTarget()).toBe("_blank")
        expect(link?.getTitle()).toBe("Example")
        expect($getRoot().getTextContent()).toBe("https://example.com")
        expect($isTextNode(text) && text.hasFormat("code")).toBe(true)
        expect($isTextNode(text) && text.hasFormat("bold")).toBe(true)
        expect($isTextNode(text) && text.getStyle()).toBe("color: red")
      })

      editor.dispatchCommand(UNDO_COMMAND, undefined)
      editor.update(() => undefined, { discrete: true })
      editor.getEditorState().read(() => {
        const link = $nodesOfType(AutoLinkNode)[0]
        const text = link?.getFirstChild()

        expect(link?.getIsUnlinked()).toBe(false)
        expect($getRoot().getTextContent()).toBe("https://example.com")
        expect($isTextNode(text) && text.hasFormat("code")).toBe(false)
        expect($isTextNode(text) && text.hasFormat("bold")).toBe(true)
        expect($isTextNode(text) && text.getStyle()).toBe("color: red")
      })
    } finally {
      history()
      editor.dispose()
    }
  })

  test("does not create active links in native code blocks or inline code", () => {
    const editor = createEditor()

    try {
      editor.update(
        () => {
          $getRoot()
            .clear()
            .append(
              $createCodeNode().append(
                $createTextNode("https://code.example.com"),
              ),
              $createParagraphNode().append(
                $createTextNode("https://inline.example.com").toggleFormat(
                  "code",
                ),
              ),
              $createParagraphNode().append(
                $createTextNode("https://prose.example.com"),
              ),
            )
        },
        { discrete: true },
      )
      editor.getEditorState().read(() => {
        const links = $nodesOfType(AutoLinkNode)
        const active = links.filter((node) => !node.getIsUnlinked())

        expect(active.map((node) => node.getURL())).toEqual([
          "https://prose.example.com",
        ])
        const code = $getRoot().getFirstChild()

        if (!$isElementNode(code))
          throw new Error("Code block was not created.")
        expect(code.getChildren().some($isAutoLinkNode)).toBe(false)
      })
    } finally {
      editor.dispose()
    }
  })

  test("does not recognize active script schemes as automatic links", () => {
    const editor = createEditor()

    try {
      editor.update(
        () => {
          $getRoot()
            .clear()
            .append(
              $createParagraphNode().append(
                $createTextNode("javascript:alert(1) data:text/html,test"),
              ),
            )
        },
        { discrete: true },
      )
      editor.getEditorState().read(() => {
        expect($nodesOfType(AutoLinkNode)).toHaveLength(0)
      })
    } finally {
      editor.dispose()
    }
  })
})
