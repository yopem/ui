import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

test("MDX renderer maps headings, links and code to docs components", () => {
  const source = readFileSync(
    new URL("../../src/catalog/guide-content.tsx", import.meta.url),
    "utf8",
  )
  expect(source).toContain(
    'id={typeof children === "string" ? headingId(children)',
  )
  expect(source).toContain("a: (props) => <Link xstyle={docsStyles.link}")
  expect(source).toContain("return <CopyableCode code={code} />")
  expect(source).toContain("<DocsPage toc={guideToc(source)}>")
})
