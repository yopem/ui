import { expect, test } from "@playwright/test"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

for (const fixture of [
  {
    framework: "vite",
    path: "vite.config.ts",
    config: `import stylex from "@stylexjs/unplugin"
export default { plugins: [stylex.vite({})], resolve: { alias: { "@": "./src" } } }
`,
  },
  {
    framework: "astro",
    path: "astro.config.mjs",
    config: `import stylex from "@stylexjs/unplugin"
import react from "@astrojs/react"
export default { integrations: [react()], vite: { plugins: [stylex.vite({})], resolve: { alias: { "@": "./src" } } } }
`,
  },
] as const) {
  test(`CLI rejects incomplete ${fixture.framework} StyleX configuration`, () => {
    const root = mkdtempSync(join(tmpdir(), "yopem-incomplete-stylex-"))
    try {
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({
          dependencies: { [fixture.framework]: "*", react: "*" },
        }),
      )
      writeFileSync(join(root, "tsconfig.json"), "{}")
      writeFileSync(join(root, fixture.path), fixture.config)

      const result = spawnSync(
        "bun",
        [join(process.cwd(), "packages/cli/src/cli.ts"), "init"],
        { cwd: root, encoding: "utf8" },
      )
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        `Incomplete Yopem build configuration in ${fixture.path}`,
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}
