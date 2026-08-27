import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
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

  test("every Tailwind demo has a StyleX counterpart", async () => {
    const tailwind = await tsxNames(
      resolve(root, "apps/docs/src/components/demos/tailwind"),
    )
    const stylex = await tsxNames(
      resolve(root, "apps/docs/src/components/demos/stylex"),
    )
    expect(tailwind).toHaveLength(508)
    expect(stylex).toEqual(tailwind)
  })

  test("StyleX source does not import Tailwind implementations", async () => {
    for (const directory of [
      "packages/registry/src/components/ui",
      "apps/docs/src/components/demos/stylex",
    ]) {
      const fullDirectory = resolve(root, directory)
      for (const file of await readdir(fullDirectory)) {
        if (!file.endsWith(".tsx")) continue
        const content = await readFile(resolve(fullDirectory, file), "utf8")
        expect(content).not.toContain("/ui/tailwind/")
        expect(content).not.toContain("class-variance-authority")
        expect(content).not.toContain("tailwind-merge")
      }
    }
  })
})
