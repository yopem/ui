import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

export function testInlineFlexOverride(name: string, style: string) {
  test(`${name} composes inline-flex through xstyle instead of competing classes`, () => {
    const source = readFileSync(
      new URL(
        `../../../../src/components/examples/stylex/${name}.tsx`,
        import.meta.url,
      ),
      "utf8",
    )
    expect(source).toContain('display: "inline-flex"')
    expect(source).toContain(`<Flex xstyle={exampleStyles.${style}}>`)
    expect(source).not.toContain(
      `<Flex {...stylex.props(exampleStyles.${style})}>`,
    )
  })
}
