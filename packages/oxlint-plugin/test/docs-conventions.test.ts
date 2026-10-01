import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../../..")

const oxlint = join(root, "node_modules/.bin/oxlint")

test("docs lint accepts StyleX and rejects forbidden styling", () => {
  const directory = mkdtempSync(join(root, "apps/docs/src/lint-fixture-"))
  const source = join(directory, "preview.tsx")

  try {
    writeFileSync(
      source,
      `
      import { Box } from "@/components/ui/box"
      import * as stylex from "@stylexjs/stylex"

      const styles = stylex.create({ root: { padding: "1rem" } })

      export function Preview() {
        return <Box xstyle={styles.root}>Content</Box>
      }
    `,
    )

    const valid = spawnSync(oxlint, ["--config", "oxlint.config.ts", source], {
      cwd: root,
      encoding: "utf8",
    })

    expect(valid.status, valid.stdout + valid.stderr).toBe(0)

    writeFileSync(
      source,
      `
      import { Box } from "@/components/ui/box"
      import * as stylex from "@stylexjs/stylex"

      const styles = stylex.create({ root: { backgroundColor: "#fff" } })

      export function Preview() {
        return <div><Box className="custom" xstyle={styles.root}>Content</Box></div>
      }
    `,
    )

    const invalid = spawnSync(
      oxlint,
      ["--config", "oxlint.config.ts", source],
      {
        cwd: root,
        encoding: "utf8",
      },
    )

    expect(invalid.status).not.toBe(0)
    const output = invalid.stdout + invalid.stderr
    expect(output).toContain("yopem-ui(no-raw-stylex-colors)")
    expect(output).toContain("className")
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
})
