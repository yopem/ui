import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { testStylePropsContract } from "./style-props-contract"

testStylePropsContract("otp-field")

test("OTP mask remains a primitive control rather than a CSS prop", () => {
  const source = readFileSync(
    new URL("../../../src/components/ui/otp-field.tsx", import.meta.url),
    "utf8",
  )
  expect(source).toContain(
    'mask?: React.ComponentProps<typeof OTPFieldPrimitive.Root>["mask"]',
  )
  expect(source).toContain("mask={mask}")
  expect(source).toMatch(/mask,\s+\.\.\.restProps/)
})
