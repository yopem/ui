import { ownPropNotes, usageNotes } from "@registry/docs-notes"
import { expect, test } from "bun:test"

test("base notes distinguish spacing tokens, cascade order, and css limits", () => {
  const notes = usageNotes.base!.join(" ")
  for (const contract of [
    'p={4} is 1rem, while p="4px" is literal CSS',
    "defaults, variants, style props, xstyle, then explicit inline style",
    "className uses the CSS cascade and is not guaranteed to win last",
    "base, sm, md, lg, xl, 2xl",
    "mdDown is below md",
    "Reversed ranges are rejected",
    "do not accept arbitrary selectors, raw at-rules, keyframes",
    "css={styles.custom}",
    "StyleX --spacing theme token",
    "Spread only domProps",
    "Conditional-only declarations fall back to unset",
    "not consumer source",
  ]) {
    expect(notes).toContain(contract)
  }
  expect(ownPropNotes.xstyle).toContain("style props")
  expect(ownPropNotes.className).toContain("not guaranteed to win last")
})
