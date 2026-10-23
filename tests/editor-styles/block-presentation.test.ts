import {
  $getEditorBlockPresentation,
  editorBlockPresentationState,
  parseEditorBlockPresentation,
} from "@editor/block-presentation"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $setState,
  createEditor,
  createState,
} from "lexical"

function editor() {
  return createEditor({
    namespace: "block-presentation-test",
    onError(error) {
      throw error
    },
  })
}

function block() {
  const node = $getRoot().getFirstChildOrThrow()

  if (!$isElementNode(node)) throw new Error("Expected block")

  return node
}

describe("block presentation codec", () => {
  test("parser can be passed directly as a detached callback", () => {
    const parse = parseEditorBlockPresentation
    expect(
      [{ lineHeight: "2", textIndent: "24px" }, null].map((value) =>
        parse(value),
      ),
    ).toEqual([
      { lineHeight: "2", textIndent: "24px" },
      { lineHeight: "", textIndent: "" },
    ])
  })

  test("accepts supported boundaries and drops unknown fields", () => {
    for (const lineHeight of ["", "1", "1.25", "3.999", "4.0"])
      for (const textIndent of ["", "0px", "160px", "10rem", "10em", "0.5em"])
        expect(
          parseEditorBlockPresentation({
            lineHeight,
            textIndent,
            color: "red",
          }),
        ).toEqual({ lineHeight, textIndent })
  })

  test("invalid fields reset independently and malformed input resets both", () => {
    for (const lineHeight of [
      "0",
      "4.1",
      "1px",
      "calc(2)",
      "var(--x)",
      "Infinity",
      "2; color:red",
      2,
      null,
    ])
      expect(
        parseEditorBlockPresentation({ lineHeight, textIndent: "24px" }),
      ).toEqual({ lineHeight: "", textIndent: "24px" })

    for (const textIndent of [
      "-1px",
      "161px",
      "10.1em",
      "20%",
      "url(x)",
      "NaNpx",
      24,
      null,
    ])
      expect(
        parseEditorBlockPresentation({ lineHeight: "2", textIndent }),
      ).toEqual({ lineHeight: "2", textIndent: "" })

    for (const value of [
      undefined,
      null,
      false,
      "bad",
      [],
      {},
      { lineHeight: "2" },
    ])
      expect(parseEditorBlockPresentation(value)).toEqual({
        lineHeight: value instanceof Object && "lineHeight" in value ? "2" : "",
        textIndent: "",
      })
  })

  test("JSON round trips preserve presentation, content and unrelated NodeState", () => {
    const source = editor()

    const other = createState("other", {
      parse: (value) => (value === "keep" ? "keep" : ""),
    })

    source.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode("Alpha"),
        )

        $setState(paragraph, editorBlockPresentationState, {
          lineHeight: "2",
          textIndent: "24px",
        })
        $setState(paragraph, other, "keep")
        $getRoot().append(paragraph)
      },
      { discrete: true },
    )
    const json = source.getEditorState().toJSON()
    expect(json.root.children[0]).toMatchObject({
      $: {
        editorBlockPresentation: { lineHeight: "2", textIndent: "24px" },
        other: "keep",
      },
    })
    const target = editor()
    target.setEditorState(target.parseEditorState(JSON.stringify(json)))
    target.getEditorState().read(() => {
      expect($getEditorBlockPresentation(block())).toEqual({
        lineHeight: "2",
        textIndent: "24px",
      })
      expect(block().getTextContent()).toBe("Alpha")
    })
    target.update(
      () => {
        $setState(
          block(),
          editorBlockPresentationState,
          parseEditorBlockPresentation(undefined),
        )
      },
      { discrete: true },
    )
    expect(target.getEditorState().toJSON().root.children[0]).toMatchObject({
      $: { other: "keep" },
    })
    expect(source.getEditorState().toJSON()).toEqual(json)
  })

  test("untrusted serialized state is validated on read", () => {
    const target = editor()
    target.setEditorState(
      target.parseEditorState(
        JSON.stringify({
          root: {
            type: "root",
            version: 1,
            children: [
              {
                type: "paragraph",
                version: 1,
                children: [],
                $: {
                  editorBlockPresentation: {
                    lineHeight: "2; color:red",
                    textIndent: "10rem",
                  },
                },
              },
            ],
          },
        }),
      ),
    )
    target.getEditorState().read(() =>
      expect($getEditorBlockPresentation(block())).toEqual({
        lineHeight: "",
        textIndent: "10rem",
      }),
    )
  })
})
