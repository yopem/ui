import { compactDocs, extractDocs } from "@registry/docs-extract"
import generated from "@registry/docs.generated.json"
import { expect, test } from "bun:test"

const docs = extractDocs()
function part(item: string, name: string) {
  const result = docs
    .find((entry) => entry.name === item)
    ?.parts.find((entry) => entry.name === name)
  expect(result, `${item}.${name}`).toBeDefined()
  return result!
}

test("manager methods expose each argument's option fields", () => {
  const add = part("toast", "toastManager.add")
  expect(add.kind).toBe("function")
  expect(add.parameters[0]?.properties.map((prop) => prop.name)).toEqual(
    expect.arrayContaining([
      "title",
      "description",
      "timeout",
      "onClose",
      "priority",
    ]),
  )
  expect(
    add.parameters[0]?.properties.find((prop) => prop.name === "timeout"),
  ).toMatchObject({
    type: "undefined | number",
    required: false,
    default: "5000",
    source: "@base-ui/react/toast/useToastManager.d.mts",
  })
  expect(
    add.parameters[0]?.properties.find((prop) => prop.name === "timeout")
      ?.description,
  ).toContain("auto dismissed")
  expect(add.returns).toEqual({ type: "string", properties: [] })
  const update = part("toast", "toastManager.update")
  expect(update.parameters[0]).toMatchObject({
    name: "id",
    type: "string",
    properties: [],
  })
  expect(update.parameters[1]?.properties.map((prop) => prop.name)).toEqual(
    expect.arrayContaining(["title", "description", "timeout", "onClose"]),
  )
  expect(
    update.parameters[1]?.properties.some((prop) => prop.name === "id"),
  ).toBe(false)
  expect(part("toast", "toastManager.close").parameters[0]?.required).toBe(
    false,
  )
  expect(
    part("toast", "toastManager.promise").parameters[1]?.properties.map(
      (prop) => prop.name,
    ),
  ).toEqual(["error", "loading", "success"])
  expect(part("toast", "toastManager.promise").returns?.properties).toEqual([])
})

test("hooks expose return fields and shallow callable helpers", () => {
  expect(part("sidebar", "useSidebar").returns?.properties).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "open", type: "boolean" }),
      expect.objectContaining({
        name: "setOpen",
        type: "(open: boolean) => void",
      }),
    ]),
  )
  expect(part("sidebar", "useSidebar.setOpen").parameters[0]).toMatchObject({
    name: "open",
    type: "boolean",
  })
  expect(
    part("combobox", "useComboboxFilter").returns?.properties.map(
      (prop) => prop.name,
    ),
  ).toEqual(["contains", "endsWith", "startsWith"])
  expect(
    part("combobox", "useComboboxFilter").parameters[0]?.properties.map(
      (prop) => prop.name,
    ),
  ).toContain("locale")
  for (const helper of ["contains", "endsWith", "startsWith"]) {
    const entry = part("combobox", `useComboboxFilter.${helper}`)
    expect(entry.parameters.map((parameter) => parameter.name)).toEqual([
      "item",
      "query",
      "itemToString",
    ])
    expect(entry.parameters[2]?.type).toContain("(item: Item) => string")
    expect(entry.returns).toEqual({ type: "boolean", properties: [] })
  }
  expect(
    docs
      .flatMap((item) => item.parts)
      .some((entry) => entry.name.split(".").length > 2),
  ).toBe(false)
  expect(
    docs
      .flatMap((item) => item.parts)
      .some((entry) => entry.name.startsWith("ComboboxContext.")),
  ).toBe(false)
  expect(
    docs
      .flatMap((item) => item.parts)
      .some((entry) => entry.name.includes(" subscribe")),
  ).toBe(false)
})

test("generated callable fields stay in sync", () => {
  expect(compactDocs(docs)).toEqual(generated)
})
