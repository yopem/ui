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
    'plugins: [stylePropsBabel, ["@stylexjs/babel-plugin"',
  )
  expect(source.match(/code="@stylex;"/g)).toHaveLength(1)
  expect(source).toContain('devMode: "css-only"')
  expect(source).not.toContain("virtual:stylex:runtime")
})
