import { expect, test } from "bun:test"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript-api"

const project = resolve(import.meta.dir, "../../..")

test("docs and examples use StyleX rather than inline styles or CSS classes", () => {
  const violations: string[] = []
  for (const directory of ["catalog", "routes", "components/examples/stylex"]) {
    const root = resolve(project, "apps/docs/src", directory)
    for (const file of readdirSync(root, {
      recursive: true,
      encoding: "utf8",
    }).filter((name) => name.endsWith(".tsx"))) {
      const source = ts.createSourceFile(
        file,
        readFileSync(resolve(root, file), "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      )
      function visit(node: ts.Node) {
        if (ts.isJsxAttribute(node)) {
          const name = node.name.getText(source)
          if (
            name === "style" ||
            (name === "className" &&
              node.initializer &&
              ts.isStringLiteral(node.initializer))
          ) {
            violations.push(`${directory}/${file}: ${node.getText(source)}`)
          }
        }
        if (
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
          node.tagName.getText(source) === "style"
        ) {
          violations.push(`${directory}/${file}: embedded stylesheet`)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
  expect(violations).toEqual([])
  expect(existsSync(resolve(project, "apps/docs/src/catalog/docs.css"))).toBe(
    false,
  )
})

test("docs do not depend on Tailwind or Fumadocs UI", () => {
  const manifest = JSON.parse(
    readFileSync(resolve(project, "apps/docs/package.json"), "utf8"),
  )
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  for (const name of ["tailwindcss", "@tailwindcss/vite", "fumadocs-ui"])
    expect(dependencies[name]).toBeUndefined()
  expect(dependencies["fumadocs-core"]).toBeDefined()
})

test("theme changes use StyleX classes instead of imperative inline styling", () => {
  for (const name of ["theme-provider.tsx", "theme.tsx"]) {
    expect(
      readFileSync(resolve(import.meta.dir, "../src/theme", name), "utf8"),
    ).not.toContain(".style.")
  }
})
