import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../../src/routes/docs/installation.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../../src/content/installation.mdx", import.meta.url),
  "utf8",
)

test("Vite frameworks compile props before StyleX; only Next uses Babel and PostCSS", () => {
  expect(content.match(/styleProps\.vite\(\),\s+stylex\.vite\(/g)).toHaveLength(
    4,
  )
  expect(content).toContain('tanstackRouter({ target: "react"')
  expect(content).toContain('require("./src/lib/style-props-babel.ts").default')
  expect(content).toContain("@stylexjs/postcss-plugin")
  expect(content).toContain("@stylex;")
  expect(content).toContain('devMode: "css-only"')
  expect(content).toContain('class={html.className} data-theme="light"')
  expect(content).toContain("class={body.className}")
  expect(content).toContain('"baseUrl": "."')
  expect(content).not.toContain("virtual:stylex:runtime")
})

test("installation offers one-command initialization and manual setup", () => {
  expect(route).toContain('code="bunx @yopem-ui/cli init"')
  expect(route).toContain('value="manual">Manual</TabsTab>')
  expect(route).toContain("data.files.map((file) => (")
  expect(route).toContain("components={{ InstallationMethods }}")
  expect(content).toContain("bunx @yopem-ui/cli init")
  expect(content).toContain('<span id="choose" />')
  expect(content).toContain("manual\nreferences for custom projects")
})
