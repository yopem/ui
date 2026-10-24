import * as babel from "prettier/plugins/babel"
import * as estree from "prettier/plugins/estree"
import * as graphql from "prettier/plugins/graphql"
import * as html from "prettier/plugins/html"
import * as markdown from "prettier/plugins/markdown"
import * as postcss from "prettier/plugins/postcss"
import * as typescript from "prettier/plugins/typescript"
import * as yaml from "prettier/plugins/yaml"
import { format } from "prettier/standalone"

import type { EditorCodeFormatter } from "./code-model"

const parsers = new Map([
  ["javascript", "babel"],
  ["js", "babel"],
  ["jsx", "babel"],
  ["typescript", "typescript"],
  ["ts", "typescript"],
  ["tsx", "typescript"],
  ["json", "json"],
  ["webmanifest", "json"],
  ["json5", "json5"],
  ["css", "css"],
  ["scss", "scss"],
  ["less", "less"],
  ["html", "html"],
  ["markup", "html"],
  ["vue", "vue"],
  ["markdown", "markdown"],
  ["md", "markdown"],
  ["graphql", "graphql"],
  ["yaml", "yaml"],
  ["yml", "yaml"],
])

export function getEditorCodeParser(language: string) {
  return parsers.get(language) ?? null
}

export function formatEditorCode(text: string, language: string) {
  const parser = getEditorCodeParser(language)

  if (!parser) throw new Error("Formatting is not supported for this language")

  return format(text, {
    parser,
    plugins: [
      babel,
      estree,
      graphql,
      html,
      markdown,
      postcss,
      typescript,
      yaml,
    ],
  })
}

export const prettierEditorCodeFormatter: EditorCodeFormatter = {
  supports(language) {
    return getEditorCodeParser(language) !== null
  },
  format: formatEditorCode,
}
