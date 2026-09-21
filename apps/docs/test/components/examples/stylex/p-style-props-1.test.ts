import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-style-props-1.tsx",
    import.meta.url,
  ),
  "utf8",
)
const transpiler = new Bun.Transpiler({ loader: "tsx" })

test("style props fixture uses the canonical Button and named example export", () => {
  const scan = transpiler.scan(source)
  expect(scan.exports).toEqual(["Example"])
  expect(scan.imports.map(({ path }) => path)).toContain(
    "@/components/ui/stylex/button",
  )
  expect(source).not.toContain("resolveStyleProps")
  expect(source).not.toContain("splitStyleProps")
  expect(source).not.toContain("useEffect")
})

test("fixture exercises values, responsive fallback, direction, and native states", () => {
  for (const contract of [
    "p={4}",
    'p="13px"',
    "p={[2, null, 6]}",
    "p={{ base: 2, md: 4, lg: 6 }}",
    "p={{ base: 2, mdToLg: 5 }}",
    'dir="ltr"',
    'dir="rtl"',
    "ps={6}",
    "pe={2}",
    "ms={-2}",
    "gap={3}",
    "spaceX={-2}",
    "_hover={{ p: 6 }}",
    "_focusVisible=",
    "_disabled={{ opacity: 0.4 }}",
    "xstyle={styles.override}",
    "className={stylex.props(styles.consumerClass).className}",
    'aria-live="polite"',
  ])
    expect(source).toContain(contract)
  expect(transpiler.transformSync(source)).toContain("Interactive styles")
})
