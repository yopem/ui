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
    resolve(import.meta.dir, "../routes/docs/theming.tsx"),
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
    palette: "tokens.stylex.ts",
    extension: "app-tokens.stylex.ts",
    scope: "preview.tsx",
    usage: "panel.tsx",
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
      if (name === "palette") {
        examples[name] =
          `${readFileSync(resolve(root, "packages/registry/src/styles/tokens.stylex.ts"), "utf8")}\n${examples[name]}`
      }
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
      if (name === "palette") {
        const rules = result.metadata.stylex.map(
          (entry: [string, { ltr: string }]) => entry[1].ltr,
        )
        expect(
          rules.find((rule: string) => rule.includes("--primary:#93c5fd")),
        ).toContain("--foreground:oklch(97% 0 none)")
      }
      if (
        ["palette", "extension", "scope", "usage", "overrides"].includes(name)
      ) {
        expect(result.metadata.stylex.length).toBeGreaterThan(0)
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
