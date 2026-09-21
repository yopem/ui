import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

export function testTypedTableCells(example: string, fields: string[]) {
  test(`${example} renders typed fields for its accessor columns`, () => {
    const source = readFileSync(
      new URL(
        `../../../../src/components/examples/stylex/${example}.tsx`,
        import.meta.url,
      ),
      "utf8",
    )
    for (const field of fields) {
      expect(source).toContain(`accessorKey: "${field}"`)
      expect(source).toContain(`row.original.${field}`)
      expect(source).not.toContain(`row.getValue("${field}")`)
    }
  })
}
