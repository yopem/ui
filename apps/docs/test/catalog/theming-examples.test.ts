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
    resolve(import.meta.dir, "../../src/routes/docs/theming.tsx"),
    "utf8",
  )
  const examples = Object.fromEntries(
    [...source.matchAll(/const (\w+) = `([\s\S]*?)`/g)].map((match) => [
      match[1],
      match[2],
    ]),
  )
  const directory = mkdtempSync(join(tmpdir(), "yopem-theming-examples-"))
  const filenames = {
    tokenValues: "tokens.stylex.ts",
    overrides: "action.tsx",
    rootSetup: "document.tsx",
    switcher: "theme-picker.tsx",
  }
  const transpiler = new Bun.Transpiler({ loader: "tsx" })
  try {
    for (const [name, filename] of Object.entries(filenames)) {
      expect(examples[name]).toBeDefined()
      examples[name] = examples[name].replaceAll(
        '"@/styles/tokens.stylex"',
        '"./tokens.stylex"',
      )
      writeFileSync(join(directory, filename), examples[name])
    }
    for (const [name, filename] of Object.entries(filenames)) {
      const result = transformSync(transpiler.transformSync(examples[name]), {
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
      if (name === "overrides")
        expect(result.metadata.stylex.length).toBeGreaterThan(0)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
