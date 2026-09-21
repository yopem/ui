import {
  aliases,
  breakpoints,
  getConditions,
} from "@registry/lib/style-props-config"
import { expect, test } from "bun:test"

test("breakpoint ranges use nonoverlapping fractional upper bounds", () => {
  const conditions = getConditions()
  expect(breakpoints.md).toBe(768)
  expect(conditions.mdDown).toBe("@media (max-width: 767.98px)")
  expect(conditions.mdOnly).toBe(
    "@media (min-width: 768px) and (max-width: 1023.98px)",
  )
  expect(conditions.mdToXl).toBe(
    "@media (min-width: 768px) and (max-width: 1535.98px)",
  )
  expect(conditions["2xlOnly"]).toBe("@media (min-width: 1536px)")
  expect(conditions.xlToMd).toBeUndefined()
})

test("theme and contrast conditions match runtime attributes and preferences", () => {
  const conditions = getConditions()
  expect(conditions._dark).toBe(
    ":where([data-theme=dark], [data-theme=dark] *)",
  )
  expect(conditions._light).toBe(
    ":where([data-theme=light], [data-theme=light] *)",
  )
  expect(conditions._moreContrast).toBe("@media (prefers-contrast: more)")
  expect(conditions._lessContrast).toBe("@media (prefers-contrast: less)")
})

test("logical aliases stay logical rather than hardcoded LTR", () => {
  expect(aliases.ms).toEqual(["marginInlineStart"])
  expect(aliases.pe).toEqual(["paddingInlineEnd"])
  expect(aliases.start).toEqual(["insetInlineStart"])
  expect(aliases.roundedEnd).toEqual([
    "borderStartEndRadius",
    "borderEndEndRadius",
  ])
  expect(aliases.boxSize).toEqual(["width", "height"])
})
