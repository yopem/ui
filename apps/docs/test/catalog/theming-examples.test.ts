import { expect, test } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dir, "../../../..")
const docsRequire = createRequire(resolve(root, "apps/docs/package.json"))
const compilerRequire = createRequire(docsRequire.resolve("@stylexjs/unplugin"))
const { transformSync } = compilerRequire("@babel/core")
const plugin = compilerRequire("@stylexjs/babel-plugin")

test("copyable theming examples compile with the installed StyleX transform", () => {
  const source = readFileSync(
    resolve(import.meta.dir, "../../src/content/theming.mdx"),
    "utf8",
  )
  const examples = [...source.matchAll(/```tsx\n([\s\S]*?)\n```/g)].map(
    (match) => match[1],
  )
  const directory = mkdtempSync(join(tmpdir(), "yopem-theming-examples-"))
  const filenames = [
    "tokens.stylex.ts",
    "action.tsx",
    "document.tsx",
    "theme-picker.tsx",
  ]
  expect(examples).toHaveLength(filenames.length)
  const transpiler = new Bun.Transpiler({ loader: "tsx" })
  try {
    for (const [index, filename] of filenames.entries()) {
      const example = examples[index]
      if (!example) throw new Error(`Missing theming example: ${filename}`)
      writeFileSync(
        join(directory, filename),
        example.replaceAll('"@/styles/tokens.stylex"', '"./tokens.stylex"'),
      )
    }
    for (const [index, filename] of filenames.entries()) {
      const example = examples[index]
      if (!example) throw new Error(`Missing theming example: ${filename}`)
      const result = transformSync(transpiler.transformSync(example), {
        filename: join(directory, filename),
        plugins: [
          [
            plugin,
            {
              aliases: {
                "@/*": [resolve(root, "packages/registry/src/*")],
              },
              dev: false,
              runtimeInjection: false,
              unstable_moduleResolution: { type: "commonJS", rootDir: root },
            },
          ],
        ],
      })
      expect(result.code).toBeTruthy()
      if (filename === "action.tsx")
        expect(result.metadata.stylex.length).toBeGreaterThan(0)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
