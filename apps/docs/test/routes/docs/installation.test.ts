import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/installation.tsx", import.meta.url),
  "utf8",
)

test("installation config compiles static props before StyleX extraction", () => {
  expect(
    source.match(
      /const stylePropsBabel = "\.\/src\/lib\/style-props-babel\.ts"/g,
    ),
  ).toHaveLength(3)
  expect(
    source.match(/babel\(\{ plugins: \[stylePropsBabel\] \}\)/g),
  ).toHaveLength(2)
  expect(
    source.match(/plugins: \[stylePropsBabel, \["@stylexjs\/babel-plugin"/g),
  ).toHaveLength(3)
  expect(source).toContain('require("./src/lib/style-props-babel.ts").default')
})
