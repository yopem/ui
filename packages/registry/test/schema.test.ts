import {
  registryItemFileSchema,
  registryItemSchema,
  registryItemTypeSchema,
  registrySchema,
} from "@registry/schema"
import { describe, expect, test } from "bun:test"

const file = {
  path: "components/ui/button.tsx",
  target: "components/ui/button.tsx",
  type: "registry:ui" as const,
}

const item = {
  description: "Button component",
  files: [file],
  name: "button",
  registryVersion: "0.1.0",
  schemaVersion: 1 as const,
  title: "Button",
  type: "registry:ui" as const,
}

describe("registry schemas", () => {
  test("accept valid records and apply collection defaults", () => {
    expect(registryItemTypeSchema.options).toEqual([
      "registry:base",
      "registry:hook",
      "registry:lib",
      "registry:style",
      "registry:ui",
    ])
    expect(registryItemFileSchema.parse(file)).toEqual(file)
    expect(registryItemSchema.parse(item)).toMatchObject({
      ...item,
      categories: [],
      dependencies: [],
      devDependencies: [],
      peerDependencies: [],
      registryDependencies: [],
    })
    expect(
      registrySchema.parse({
        homepage: "https://ui.yopem.com",
        items: [item],
        name: "yopem-ui",
        schemaVersion: 1,
        version: "0.1.0",
      }).items,
    ).toHaveLength(1)
  })

  test.each([
    ["uppercase name", { ...item, name: "Button" }],
    ["empty files", { ...item, files: [] }],
    ["wrong schema version", { ...item, schemaVersion: 2 }],
    ["invalid schema URL", { ...item, $schema: "not-a-url" }],
    ["empty file path", { ...item, files: [{ ...file, path: "" }] }],
    ["unknown type", { ...item, type: "registry:unknown" }],
  ])("rejects %s", (_name, value) => {
    expect(registryItemSchema.safeParse(value).success).toBe(false)
  })

  test("rejects invalid registry metadata", () => {
    expect(
      registrySchema.safeParse({
        homepage: "relative",
        items: [],
        name: "yopem-ui",
        schemaVersion: 2,
        version: "0.1.0",
      }).success,
    ).toBe(false)
  })
})
