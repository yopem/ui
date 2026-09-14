import { foundationItems } from "@registry/items/foundation"
import { expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

test("first setup has three shared files and optional theme runtime", () => {
  const base = foundationItems.find((item) => item.name === "base")!
  const theme = foundationItems.find((item) => item.name === "theme")!
  expect(base.files.map((file) => file.path).sort()).toEqual([
    "lib/stylex.ts",
    "styles/styles.css",
    "styles/tokens.stylex.ts",
  ])
  expect(
    base.dependencies.some((dependency) => dependency.includes("fontsource")),
  ).toBe(false)
  expect(theme.files.map((file) => file.path).sort()).toEqual([
    "theme/theme-provider.tsx",
    "theme/theme.tsx",
  ])
  expect(theme.registryDependencies).toEqual(["base"])
})

test("handwritten CSS contains no theme values or moved compatibility files", () => {
  const directory = resolve(import.meta.dir, "../src/styles")
  expect(
    readdirSync(directory).filter((file) => file.endsWith(".css")),
  ).toEqual(["styles.css"])
  const css = readFileSync(resolve(directory, "styles.css"), "utf8")
  expect(css).not.toMatch(/--[\w-]+\s*:/)
  expect(css).not.toContain("@import")
  expect(css).not.toContain("svg:not")
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) =>
    `${match[1]}{${match[2]}}`.replace(/\s+/g, " ").trim(),
  )
  expect(new Set(blocks).size).toBe(blocks.length)
  expect(css.split("\n").length).toBeLessThanOrEqual(160)
})
