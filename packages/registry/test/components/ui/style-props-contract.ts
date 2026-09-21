import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript-api"

export function testStylePropsContract(name: string) {
  const source = readFileSync(
    resolve(import.meta.dirname, "../../../src/components/ui", `${name}.tsx`),
    "utf8",
  )

  test(`${name} strips CSS props before forwarding and gives xstyle precedence`, () => {
    expect(source).toContain("StyleComponentProps")
    const consumers = source.match(/xstyle: consumerXstyle/g) ?? []
    const splits = source.match(/splitStyleProps\(restProps\)/g) ?? []
    const compositions = source.match(/\[styleProps, consumerXstyle\]/g) ?? []
    expect(consumers.length).toBeGreaterThan(0)
    expect(splits).toHaveLength(consumers.length)
    expect(compositions).toHaveLength(consumers.length)
    expect(source).not.toMatch(/\{\.\.\.restProps\}/)
  })

  test(`${name} keeps explicit styles merged with extracted CSS variables`, () => {
    const file = ts.createSourceFile(
      `${name}.tsx`,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    function visit(node: ts.Node) {
      if (ts.isJsxSpreadAttribute(node)) {
        expect(node.expression.getText(file)).not.toMatch(
          /^mergeProps\(\s*(?:stylexProps|stylex\.props)\(/,
        )
      }
      if (ts.isJsxAttributes(node)) {
        const spreads = node.properties.filter(ts.isJsxSpreadAttribute)
        const hasProps = spreads.some(
          (spread) => spread.expression.getText(file) === "props",
        )
        const hasGenerated = spreads.some((spread) =>
          /^(?:stylexProps|stylex\.props)\(/.test(
            spread.expression.getText(file),
          ),
        )
        expect(hasProps && hasGenerated).toBe(false)
      }
      ts.forEachChild(node, visit)
    }
    visit(file)
  })
}
