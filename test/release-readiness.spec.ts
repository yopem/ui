import { describe, expect, test } from "bun:test"
import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const expectedComponents = [
  "accordion",
  "alert-dialog",
  "alert",
  "autocomplete",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "calendar",
  "card",
  "checkbox-group",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "drawer",
  "empty",
  "field",
  "fieldset",
  "form",
  "frame",
  "group",
  "input-group",
  "input",
  "kbd",
  "label",
  "menu",
  "meter",
  "number-field",
  "otp-field",
  "pagination",
  "popover",
  "preview-card",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle-group",
  "toggle",
  "toolbar",
  "tooltip",
].toSorted()

async function tsxNames(directory: string) {
  return (await readdir(directory))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.slice(0, -4))
    .toSorted()
}

describe("v1 release readiness", () => {
  test("all 54 canonical components and wrappers exist", async () => {
    expect(
      await tsxNames(resolve(root, "packages/registry/src/components/ui")),
    ).toEqual(expectedComponents)
    expect(
      await tsxNames(resolve(root, "apps/docs/src/components/ui/stylex")),
    ).toEqual(expectedComponents)
  })

  test("every component owns its Playwright and axe scenarios", async () => {
    const testDirectories = [
      resolve(root, "packages/registry/test/components/ui"),
      resolve(root, "apps/docs/test/components/ui/stylex"),
    ]

    for (const directory of testDirectories) {
      for (const component of expectedComponents) {
        const path = resolve(directory, `${component}-e2e.spec.ts`)
        const source = await readFile(path, "utf8")

        expect(source).toContain('from "@playwright/test"')
        expect(source).toContain('from "@axe-core/playwright"')
        expect(source).not.toMatch(/(?:run|define)\w*E2eContract/)
        expect(source).not.toMatch(/helpers\/.+contract/)
        expect(source).not.toContain(".disableRules(")
        expect(
          source.match(/\btest(?:\.describe)?\(/g)?.length ?? 0,
        ).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
