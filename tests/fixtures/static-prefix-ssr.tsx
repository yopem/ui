import { renderToString } from "react-dom/server"

import { staticPrefixDocument } from "./static-prefix-document"
import { StaticPrefixView } from "./static-prefix-view"

const html = staticPrefixDocument()

const encoded = Buffer.from(html).toString("base64")

process.stdout.write(
  `<div id="fixture" data-source="${encoded}">${renderToString(<StaticPrefixView html={html} />)}</div>`,
)
