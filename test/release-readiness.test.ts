import { describe, expect, test } from "bun:test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const expectedComponents = [
  "accordion",
  "alert-dialog",
  "alert",
  "autocomplete",
  "avatar",
  "badge",
  "box",
  "breadcrumb",
  "button",
  "calendar",
  "card",
  "center",
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
  "flex",
  "form",
  "frame",
  "grid",
  "group",
  "heading",
  "hstack",
  "input-group",
  "input",
  "kbd",
  "label",
  "link",
  "menu",
  "meter",
  "number-field",
  "otp-field",
  "pagination",
  "paragraph",
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
  "stack",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle-group",
  "toggle",
  "toolbar",
  "tooltip",
  "vstack",
].toSorted()

async function tsxNames(directory: string) {
  return (await readdir(directory))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.slice(0, -4))
    .toSorted()
}

describe("v1 release readiness", () => {
  test("all canonical components and wrappers exist", async () => {
    expect(
      await tsxNames(resolve(root, "packages/registry/src/components/ui")),
    ).toEqual(expectedComponents)
    expect(
      await tsxNames(resolve(root, "apps/docs/src/components/ui")),
    ).toEqual(expectedComponents)
  })
})
