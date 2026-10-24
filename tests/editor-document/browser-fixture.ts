import { darkTheme, lightTheme, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  documentNodes,
  downloadDocument,
  htmlDocument,
  importDocument,
} from "@yopem-ui/editor/document"
import { createEditor } from "lexical"

const root = document.getElementById("editor")

if (!root) throw new Error("Missing editor")

const editor = createEditor({
  namespace: "standalone-browser",
  nodes: documentNodes,
  onError(error) {
    throw error
  },
})

editor.setRootElement(root)

const theme =
  new URL(location.href).searchParams.get("theme") === "light"
    ? lightTheme
    : darkTheme

Object.assign(document.documentElement, stylex.props(theme))

root.style.color = tokens["--foreground"]

document.body.style.backgroundColor = tokens["--background"]

importDocument(
  editor,
  `<p><span style="color:${tokens["--foreground"]}">Foreground</span><span style="color:${tokens["--destructive"]}">Danger</span><span style="color:${tokens["--primary-foreground"]};background-color:${tokens["--primary"]}">Paired</span></p><p><a href="https://example.com" target="_blank" rel="nofollow" title="Reference info">Reference</a></p>`,
  "html",
)

const output = document.getElementById("output")

if (!(output instanceof HTMLTextAreaElement)) throw new Error("Missing output")

document.getElementById("export")?.addEventListener("click", () => {
  output.value = htmlDocument(editor)
})

document.getElementById("download")?.addEventListener("click", () => {
  downloadDocument(editor, "html", document)
})
