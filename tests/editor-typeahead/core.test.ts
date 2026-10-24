import {
  decodeMention,
  encodeMention,
  mentionMarkdown,
  parseMentionMarkdown,
  safeMentionProfileURL,
} from "@editor/mention-codec"
import { MentionNode, $createMentionNode } from "@editor/mention-node"
import { searchEditorEmoji, validateEditorEmoji } from "@editor/typeahead-emoji"
import { $readEditorTypeaheadQuery } from "@editor/typeahead-query"
import { $createCodeNode, CodeNode } from "@lexical/code"
import { $createLinkNode, LinkNode } from "@lexical/link"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical"

function query(
  text: string,
  kind: "paragraph" | "code" | "link" = "paragraph",
) {
  const editor = createEditor({
    nodes: [CodeNode, LinkNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const block = kind === "code" ? $createCodeNode() : $createParagraphNode()
      const node = $createTextNode(text)
      $getRoot().append(block)

      if (kind === "link")
        block.append($createLinkNode("https://example.com").append(node))
      else block.append(node)
      node.selectEnd()
    },
    { discrete: true },
  )

  return editor.getEditorState().read($readEditorTypeaheadQuery)
}

test("caret query has exact UTF-16 offsets and excludes invalid contexts", () => {
  expect(query("/heading")?.query).toBe("heading")
  expect(query("x /heading")).toBeNull()
  expect(query("/heading", "code")).toBeNull()
  expect(query("@Ada", "link")).toBeNull()
  expect(query("12:30")).toBeNull()
  expect(query("hello😀 @علي")?.start).toBe(8)
  expect(query("hello😀 @علي")?.end).toBe(12)
  expect(query("email@example.com")).toBeNull()
  expect(query(":" + "x".repeat(65))).toBeNull()
  expect(query("/Heading 1")?.query).toBe("Heading 1")
  expect(query("/Code block")?.query).toBe("Code block")
  expect(query("x /Heading 1")).toBeNull()
  expect(query("/Heading\n1")).toBeNull()
})

test("mention codec bounds untrusted data without authority or executable URLs", () => {
  const value = { id: "user-123", label: "Ada 👩🏽‍💻" }
  expect(decodeMention(encodeMention(value))).toEqual(value)
  expect(parseMentionMarkdown(mentionMarkdown(value))).toEqual(value)
  const boundary = { id: "界".repeat(128), label: "界".repeat(128) }
  expect(parseMentionMarkdown(mentionMarkdown(boundary))).toEqual(boundary)
  expect(parseMentionMarkdown("x".repeat(4097))).toBeNull()

  for (const input of [
    null,
    {},
    { id: "", label: "Ada" },
    { id: "a", label: "\u0000" },
    { id: "a", label: "Ada\u202eName" },
    { id: "a", label: "Ada\ufeffName" },
    { id: "x".repeat(129), label: "Ada" },
  ]) {
    expect(decodeMention(input)).toBeNull()
  }

  for (const url of [
    "javascript:alert(1)",
    "http://example.com",
    "https://user:secret@example.com",
    "//example.com",
  ])
    expect(safeMentionProfileURL(url)).toBeNull()
  expect(safeMentionProfileURL("https://example.com/users/123")).toBe(
    "https://example.com/users/123",
  )
  expect(parseMentionMarkdown("@[broken](mention:%ZZ)")).toBeNull()
  expect(decodeMention({ id: "arabic", label: "أدا 👩🏽‍💻" })).toEqual({
    id: "arabic",
    label: "أدا 👩🏽‍💻",
  })
  expect(decodeMention({ id: "persian", label: "می‌روم" })).toEqual({
    id: "persian",
    label: "می‌روم",
  })
})

test("native mention token survives JSON and has no serialized authority", () => {
  const editor = createEditor({
    nodes: [MentionNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append(
          $createMentionNode({ id: "ada", label: "Ada" }),
        ),
      )
    },
    { discrete: true },
  )
  const serialized = JSON.stringify(editor.getEditorState().toJSON())
  const state = editor.parseEditorState(serialized)
  expect(state.toJSON()).toEqual(editor.getEditorState().toJSON())
  state.read(() => {
    const node = $getRoot().getFirstDescendant()
    expect(node).toBeInstanceOf(MentionNode)

    if (node instanceof MentionNode) {
      expect(node.isTextEntity()).toBe(true)
      expect(node.isToken()).toBe(true)
      expect(node.getTextContent()).toBe("@Ada")
    }
  })
})

test("full emoji inventory searches aliases, names, ZWJ, and tones", () => {
  expect(searchEditorEmoji("smile").length).toBeGreaterThan(0)
  expect(
    searchEditorEmoji("woman technologist").some((item) =>
      item.emoji.includes("‍"),
    ),
  ).toBe(true)

  const custom = [
    { id: "coder", label: "Coder", emoji: "👩🏽‍💻", aliases: ["coder"] },
  ]

  expect(searchEditorEmoji("coder", custom)[0]?.emoji).toBe("👩🏽‍💻")
  expect(
    validateEditorEmoji({
      id: "bad",
      label: "Bad",
      emoji: "not emoji",
      aliases: [],
    }),
  ).toBeNull()
})
