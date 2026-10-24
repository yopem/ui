import "@editor/code-languages"
import { editorCodeLanguages } from "@editor/code-model"
import { $createCodeNode, CodeNode, CodeHighlightNode } from "@lexical/code"
import {
  PrismTokenizer,
  getCodeLanguages,
  isCodeLanguageLoaded,
} from "@lexical/code-prism"
import { expect, test } from "bun:test"
import { $createTextNode, createEditor } from "lexical"
import components from "prismjs/components.json"

test("language choices use canonical Lexical Prism instance", () => {
  expect(editorCodeLanguages.map((option) => option.value)).toEqual(
    getCodeLanguages().filter((value) => value !== "markup-templating"),
  )

  for (const [name, metadata] of Object.entries(components.languages)) {
    if (
      [
        "meta",
        "css-extras",
        "js-extras",
        "js-templates",
        "php-extras",
        "xml-doc",
      ].includes(name)
    )
      continue
    expect(isCodeLanguageLoaded(name)).toBe(true)

    if ("alias" in metadata) {
      const aliases = Array.isArray(metadata.alias)
        ? metadata.alias
        : [metadata.alias]

      for (const alias of aliases)
        expect(isCodeLanguageLoaded(alias)).toBe(true)
    }
  }

  for (const { value } of editorCodeLanguages)
    expect(isCodeLanguageLoaded(value)).toBe(true)
})

test.each([
  ["tsx", 'const node: JSX.Element = <div title="hello" />;'],
  ["php", '<?php echo "hello"; ?>'],
  ["erb", "<div><%= user.name %></div>"],
  ["csharp", 'public class Example { string name = "hello"; }'],
  ["yaml", 'name: "hello"'],
  ["kotlin", 'val name = "hello"'],
  ["dockerfile", "FROM node:22\nRUN echo hello"],
])("native tokenizer highlights %s", (language, text) => {
  const editor = createEditor({
    nodes: [CodeNode, CodeHighlightNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const node = $createCodeNode(language).append($createTextNode(text))
      const nodes = PrismTokenizer.$tokenize(node, language)
      expect(nodes.map((child) => child.getTextContent()).join("")).toBe(text)
      expect(
        nodes.some(
          (child) =>
            child instanceof CodeHighlightNode &&
            child.getHighlightType() !== undefined,
        ),
      ).toBe(true)
    },
    { discrete: true },
  )
})
