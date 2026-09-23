import { ownPropNotes, usageNotes } from "@registry/docs-notes"
import { expect, test } from "bun:test"

test("base notes distinguish spacing tokens, cascade order, and css limits", () => {
  const notes = usageNotes.base!.join(" ")
  for (const contract of [
    'p={4} is 1rem, while p="4px" is literal CSS',
    "defaults, variants, style props, xstyle, then explicit inline style",
    "External className is not guaranteed to win last",
    "base, sm, md, lg, xl, 2xl",
    "mdDown is below md",
    "Reversed ranges are rejected",
    "do not accept arbitrary selectors, raw at-rules, keyframes",
    "css={styles.custom}",
    "StyleX --spacing theme token",
    "before the StyleX Babel plugin",
    "dynamic style values are build errors",
    "JSX spreads are not a supported way to pass style props",
    "runtime style prop objects are unsupported",
  ]) {
    expect(notes).toContain(contract)
  }
  expect(ownPropNotes.xstyle).toContain("style props")
  expect(ownPropNotes.className).toContain("not guaranteed to win last")
})

test("layout notes cover each primitive's source-level contract", () => {
  const contracts = {
    box: [
      "div by default",
      "any intrinsic tag through as",
      "img width and height strings or numbers",
      "meta content",
      "input size",
    ],
    flex: ["display:flex", "no as prop"],
    vstack: ["centered items", "column direction", "default gap"],
    hstack: ["centered items", "row direction", "default gap"],
    stack: ["column direction", "default gap"],
    grid: ["display:grid", "no other layout default"],
    center: ["alignItems:center", "justifyContent:center"],
    link: ["native a element", "no component visual defaults", "router"],
    paragraph: ["native p element", "no component visual defaults"],
    heading: ["h2 by default", "only h1 through h6 through as"],
  } as const

  for (const [name, required] of Object.entries(contracts)) {
    const notes = usageNotes[name]
    expect(notes, name).toBeDefined()
    if (!notes) continue
    const text = notes.join(" ")
    expect(text, name).toContain("shared style props")
    expect(text, name).toContain("xstyle")
    expect(text, name).toContain("responsive values need a base value")
    for (const contract of required)
      expect(text, `${name}: ${contract}`).toContain(contract)
  }
})
