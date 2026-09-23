import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { usageExamples } from "@/catalog/usage"

const primitives = {
  box: "Box",
  flex: "Flex",
  stack: "Stack",
  hstack: "HStack",
  vstack: "VStack",
  grid: "Grid",
  center: "Center",
  link: "Link",
  paragraph: "Paragraph",
  heading: "Heading",
} as const

test("layout primitives have usage and public catalog examples", () => {
  for (const [name, component] of Object.entries(primitives)) {
    const usage = usageExamples[name]
    expect(usage, name).toBeDefined()
    if (!usage) continue

    expect(usage, name).toContain(
      `import { ${component} } from "@/components/ui/${name}"`,
    )
    expect(usage, name).toContain(`<${component}`)
    expect(usage, name).not.toMatch(
      /@tanstack\/react-router|useNavigate|useRouter/,
    )

    const path = resolve(
      import.meta.dir,
      `../../src/components/examples/stylex/p-${name}-1.tsx`,
    )
    expect(existsSync(path), name).toBe(true)
    const source = readFileSync(path, "utf8")
    expect(source, name).toContain(`@/components/ui/${name}`)
    expect(source, name).toContain(`<${component}`)
  }
})
