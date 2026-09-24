import { expect, test } from "@playwright/test"
import { spawnSync } from "node:child_process"
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  existsSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// Test exercises source directly; root workspace has no CLI dependency.
// oxlint-disable-next-line import/no-relative-parent-imports
import { initProject } from "../../packages/cli/src/init"

test("Next.js uses the shared stylesheet for StyleX", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-next-init-"))
  try {
    mkdirSync(join(root, "src/app"), { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        dependencies: { next: "*", react: "*" },
        scripts: { dev: "next dev", build: "next build" },
      }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(
      join(root, "src/app/layout.tsx"),
      'import React from "react"\nexport default function Layout(){return <html><body>Hi</body></html>}',
    )
    await initProject({
      cwd: root,
      run: () => Promise.resolve(),
      fetcher: () =>
        Promise.resolve(
          new Response(
            readFileSync(
              join(process.cwd(), "packages/registry/dist/r/base.json"),
              "utf8",
            ),
          ),
        ),
    })
    expect(readFileSync(join(root, "src/styles/styles.css"), "utf8")).toContain(
      "@stylex;",
    )
    expect(existsSync(join(root, "src/styles/stylex.css"))).toBe(false)
    expect(
      readFileSync(join(root, "src/app/layout.tsx"), "utf8"),
    ).not.toContain("stylex.css")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const fixture of [
  {
    framework: "vite",
    dependency: "vite",
    config: "vite.config.ts",
    layout: "src/main.tsx",
  },
  {
    framework: "tanstack-router",
    dependency: "@tanstack/react-router",
    config: "vite.config.ts",
    layout: "src/main.tsx",
  },
  {
    framework: "react-router",
    dependency: "@react-router/dev",
    config: "vite.config.ts",
    layout: "app/root.tsx",
  },
  {
    framework: "tanstack-start",
    dependency: "@tanstack/react-start",
    config: "vite.config.ts",
    layout: "src/routes/__root.tsx",
  },
  {
    framework: "astro",
    dependency: "astro",
    config: "astro.config.mjs",
    layout: "src/layouts/Layout.astro",
  },
] as const) {
  test(`CLI configures ${fixture.framework} with Babel and no unplugin`, async () => {
    const root = mkdtempSync(join(tmpdir(), "yopem-babel-init-"))
    const put = (path: string, text: string) => {
      mkdirSync(join(root, path, ".."), { recursive: true })
      writeFileSync(join(root, path), text)
    }
    try {
      put(
        "package.json",
        JSON.stringify({
          dependencies: { [fixture.dependency]: "*", react: "*" },
        }),
      )
      put("tsconfig.json", "{}")
      if (fixture.framework === "vite") {
        put(
          "postcss.config.cjs",
          "module.exports = { plugins: { autoprefixer: {} } }",
        )
      }
      put(
        fixture.config,
        fixture.framework === "astro"
          ? 'import { defineConfig } from "astro/config"\nexport default defineConfig({ integrations: [] })\n'
          : 'export default { plugins: [], resolve: { alias: { "@": "./src" } } }\n',
      )
      put(
        fixture.layout,
        fixture.framework === "astro"
          ? "---\n---\n<html><head></head><body></body></html>"
          : fixture.framework === "tanstack-start" ||
              fixture.framework === "react-router"
            ? 'import React from "react"\nexport function Root(){ return <html><head></head><body></body></html> }'
            : 'import React from "react"\n',
      )
      const commands: string[][] = []
      const run = (args: string[]) => {
        commands.push(args)
        return Promise.resolve()
      }
      const fetcher = () =>
        Promise.resolve(
          new Response(
            readFileSync(
              join(process.cwd(), "packages/registry/dist/r/base.json"),
              "utf8",
            ),
          ),
        )
      await initProject({
        cwd: root,
        framework: fixture.framework,
        run,
        fetcher,
      })
      expect(commands.flat()).toContain("@rolldown/plugin-babel@^0.2.4")
      const config = readFileSync(join(root, fixture.config), "utf8")
      expect(config).toContain("@rolldown/plugin-babel")
      expect(config).toContain("babel({ plugins: yopemBabelConfig.plugins })")
      expect(config).not.toContain("@stylexjs/unplugin")
      expect(
        readFileSync(join(root, "src/styles/styles.css"), "utf8"),
      ).toContain("@stylex;")
      expect(existsSync(join(root, "src/styles/stylex.css"))).toBe(false)
      expect(readFileSync(join(root, fixture.layout), "utf8")).not.toContain(
        "stylex.css",
      )
      expect(readFileSync(join(root, "babel.config.cjs"), "utf8")).toContain(
        "expandLocalSpreads",
      )
      const postcss = readFileSync(join(root, "postcss.config.cjs"), "utf8")
      expect(postcss).toContain("@stylexjs/postcss-plugin")
      expect(postcss).toContain('"app/**/*.{js,jsx,ts,tsx}"')
      if (fixture.framework === "vite")
        expect(postcss).toContain("autoprefixer")
      await initProject({
        cwd: root,
        framework: fixture.framework,
        run,
        fetcher,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

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
