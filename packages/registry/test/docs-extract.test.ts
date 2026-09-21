import { extractDocs } from "@registry/docs-extract"
import { expect, test } from "bun:test"

test("shared styling fields are excluded before component API expansion", () => {
  const docs = extractDocs()
  const parts = docs.flatMap((item) => item.parts)
  const button = parts.find((part) => part.name === "Button")!
  expect(button.props.map((prop) => prop.name)).toEqual(
    expect.arrayContaining([
      "variant",
      "size",
      "loading",
      "disabled",
      "onClick",
      "aria-label",
      "className",
      "xstyle",
      "ref",
    ]),
  )
  for (const part of parts.filter((part) => part.kind === "component")) {
    for (const props of [
      part.props,
      ...part.propVariants.map((variant) => variant.props),
    ]) {
      for (const name of [
        "marginInline",
        "paddingInline",
        "spaceX",
        "css",
        "_hover",
      ])
        expect(
          props.map((prop) => prop.name),
          part.name,
        ).not.toContain(name)
    }
  }
  const drawer = parts.find((part) => part.name === "Drawer")!
  expect(drawer.props.find((prop) => prop.name === "position")?.type).toContain(
    '"bottom"',
  )
  const autocomplete = parts.find((part) => part.name === "Autocomplete")!
  expect(autocomplete.propVariants).toHaveLength(2)
  expect(
    autocomplete.propVariants.map(
      (variant) =>
        variant.props.find((prop) => prop.name === "items")?.required,
    ),
  ).toEqual([true, false])
  const shared = parts.find((part) => part.name === "StyleProps")!
  expect(shared.props.map((prop) => prop.name)).toEqual(
    expect.arrayContaining(["marginInline", "paddingInline", "spaceX", "css"]),
  )
}, 240_000)
