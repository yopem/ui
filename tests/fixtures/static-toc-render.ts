import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { createStaticTocFixture } from "./static-toc"

const count = Number(process.argv[2])

if (![1, 2, 3].includes(count)) throw new Error("Invalid contents count")

const { html } = createStaticTocFixture(count)

process.stdout.write(
  renderToStaticMarkup(
    createElement(DocumentStatic, { html, "aria-label": "Published document" }),
  ),
)
