import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/installation.tsx", import.meta.url),
  "utf8",
)

test("Vite frameworks compile props before StyleX; only Next uses Babel and PostCSS", () => {
  expect(source.match(/styleProps\.vite\(\),\s+stylex\.vite\(/g)).toHaveLength(
    3,
  )
  expect(source).toContain("const routerConfig = viteConfig")
  expect(source).toContain('tanstackRouter({ target: "react"')
  expect(source).toContain('require("./src/lib/style-props-babel.ts").default')
  expect(source).toContain(
    'plugins: [expandLocalSpreads, stylePropsBabel, ["@stylexjs/babel-plugin"',
  )
  expect(source.match(/code="@stylex;"/g)).toHaveLength(1)
  expect(source).toContain('devMode: "css-only"')
  expect(source).toContain('class={html.className} data-theme="light"')
  expect(source).toContain("class={body.className}")
  expect(source).toContain('"baseUrl": "."')
  expect(source).toContain('const babelConfig = require("./babel.config.js")')
  expect(source).not.toContain("virtual:stylex:runtime")
})

test("installation offers one-command initialization and manual setup", () => {
  expect(source).toContain('code="bunx @yopem-ui/cli init"')
  expect(source).toContain("Next.js App Router, or Astro")
  expect(source).toContain("Unsupported or conflicting configuration stops")
  expect(source).toContain('value="manual">Manual</TabsTab>')
  expect(source).toContain("data.files.map((file) => (")
  expect(source).toContain('id="choose"')
  expect(source).toContain("manual references for custom projects")
})
