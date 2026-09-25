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
    framework: "react-router",
    dependency: "react-router",
    config: "vite.config.ts",
    layout: "src/main.tsx",
  },
  {
    framework: "react-router",
    dependency: "react-router-dom",
    config: "vite.config.ts",
    layout: "src/main.tsx",
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
  test(`CLI configures ${fixture.framework} (${fixture.dependency}) with Babel and no unplugin`, async () => {
    const root = mkdtempSync(join(tmpdir(), "yopem-babel-init-"))
    const put = (path: string, text: string) => {
      mkdirSync(join(root, path, ".."), { recursive: true })
      writeFileSync(join(root, path), text)
    }
    try {
      put(
        "package.json",
        JSON.stringify({
          dependencies: {
            [fixture.dependency]: "*",
            react: "*",
            ...(fixture.framework === "react-router" &&
            fixture.layout === "src/main.tsx"
              ? { vite: "*" }
              : {}),
          },
        }),
      )
      put("tsconfig.json", "{}")
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
              fixture.layout === "app/root.tsx"
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
        framework:
          fixture.layout === "src/main.tsx" &&
          fixture.framework === "react-router"
            ? undefined
            : fixture.framework,
        run,
        fetcher,
      })
      expect(commands.flat()).toContain("@rolldown/plugin-babel@^0.2.4")
      expect(commands.flat()).toContain("oxlint@^1.79.0")
      expect(commands.flat()).toContain("@yopem-ui/oxlint-plugin@^0.1.0")
      const lint = JSON.parse(
        readFileSync(join(root, ".oxlintrc.json"), "utf8"),
      )
      expect(lint.jsPlugins).toContainEqual({
        name: "yopem-ui",
        specifier: "@yopem-ui/oxlint-plugin",
      })
      expect(lint.rules["yopem-ui/prefer-layout-primitives"]).toBe("error")
      expect(lint.rules["yopem-ui/no-raw-stylex-colors"]).toBe("error")
      expect(lint.overrides).toContainEqual({
        files: ["src/components/ui/**/*.{tsx,jsx}"],
        rules: {
          "yopem-ui/enforce-styling-methods": "off",
          "yopem-ui/no-restyle": "off",
          "yopem-ui/no-raw-stylex-colors": "off",
          "yopem-ui/prefer-layout-primitives": "off",
          "yopem-ui/static-stylex": "off",
          "yopem-ui/valid-polymorphic-as": "off",
        },
      })
      const config = readFileSync(join(root, fixture.config), "utf8")
      expect(config).toContain("@rolldown/plugin-babel")
      expect(config).toContain('"@stylexjs/babel-plugin"')
      expect(config).toContain("yopemBabelPlugins")
      expect(config).not.toContain("@stylexjs/unplugin")
      expect(config).not.toContain("babel.config.cjs")
      expect(
        readFileSync(join(root, "src/styles/styles.css"), "utf8"),
      ).toContain("@stylex;")
      expect(existsSync(join(root, "src/styles/stylex.css"))).toBe(false)
      expect(readFileSync(join(root, fixture.layout), "utf8")).not.toContain(
        "stylex.css",
      )
      expect(existsSync(join(root, "babel.config.cjs"))).toBe(false)
      expect(config).toContain("@stylexjs/postcss-plugin")
      expect(config).toContain('"app/**/*.{js,jsx,ts,tsx}"')
      expect(existsSync(join(root, "postcss.config.cjs"))).toBe(false)
      const lintBefore = readFileSync(join(root, ".oxlintrc.json"), "utf8")
      await initProject({
        cwd: root,
        framework: fixture.framework,
        run,
        fetcher,
      })
      expect(readFileSync(join(root, ".oxlintrc.json"), "utf8")).toBe(
        lintBefore,
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

test("CLI preserves existing lint rules, plugins, and explicit opt-out", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-existing-lint-"))
  try {
    mkdirSync(join(root, "src"), { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(join(root, "src/main.tsx"), 'import React from "react"')
    writeFileSync(
      join(root, "vite.config.ts"),
      "export default { plugins: [] }",
    )
    writeFileSync(
      join(root, ".oxlintrc.json"),
      JSON.stringify({
        jsPlugins: [{ name: "other", specifier: "other-plugin" }],
        rules: {
          "no-console": "warn",
          "yopem-ui/prefer-layout-primitives": "off",
        },
      }),
    )
    const options = {
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
    }
    await initProject(options)
    const lintText = readFileSync(join(root, ".oxlintrc.json"), "utf8")
    const lint = JSON.parse(lintText)
    expect(lint.rules["no-console"]).toBe("warn")
    expect(lint.rules["yopem-ui/prefer-layout-primitives"]).toBe("off")
    expect(lint.rules["yopem-ui/static-stylex"]).toBe("error")
    expect(lint.jsPlugins).toHaveLength(2)
    await initProject(options)
    expect(readFileSync(join(root, ".oxlintrc.json"), "utf8")).toBe(lintText)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("CLI moves existing Babel and PostCSS plugins into Vite config", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-existing-config-"))
  try {
    mkdirSync(join(root, "src"), { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(join(root, "src/main.tsx"), 'import React from "react"')
    writeFileSync(
      join(root, "vite.config.ts"),
      "export default { plugins: [] }",
    )
    writeFileSync(
      join(root, "babel.config.cjs"),
      'module.exports = { plugins: ["@babel/plugin-transform-react-jsx"] }',
    )
    writeFileSync(
      join(root, "postcss.config.cjs"),
      'module.exports = { plugins: [require("autoprefixer")({ grid: true })] }',
    )
    const options = {
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
    }
    await initProject(options)
    const config = readFileSync(join(root, "vite.config.ts"), "utf8")
    expect(config).toContain('"@babel/plugin-transform-react-jsx"')
    expect(config).toContain(
      'yopemCreateRequire(import.meta.url)("autoprefixer")({ grid: true })',
    )
    expect(config).toContain("yopemPostcssPlugin")
    expect(existsSync(join(root, "babel.config.cjs"))).toBe(false)
    expect(existsSync(join(root, "postcss.config.cjs"))).toBe(false)
    await initProject(options)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("CLI migrates JSON Babel and ESM PostCSS configs for Astro", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-astro-existing-config-"))
  try {
    mkdirSync(join(root, "src/layouts"), { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { astro: "*", react: "*" } }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(
      join(root, "astro.config.mjs"),
      'import { defineConfig } from "astro/config"\nexport default defineConfig({ integrations: [] })',
    )
    writeFileSync(
      join(root, "src/layouts/Layout.astro"),
      "---\n---\n<html><head></head><body></body></html>",
    )
    writeFileSync(
      join(root, ".babelrc.json"),
      JSON.stringify({ plugins: ["@babel/plugin-transform-react-jsx"] }),
    )
    writeFileSync(
      join(root, "postcss.config.mjs"),
      'export default { plugins: { "@tailwindcss/postcss": {} } }',
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
    const config = readFileSync(join(root, "astro.config.mjs"), "utf8")
    expect(config).toContain('"@babel/plugin-transform-react-jsx"')
    expect(config).toContain(
      'yopemCreateRequire(import.meta.url)("@tailwindcss/postcss")',
    )
    expect(existsSync(join(root, ".babelrc.json"))).toBe(false)
    expect(existsSync(join(root, "postcss.config.mjs"))).toBe(false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("CLI upgrades earlier generated Vite setup without duplicate plugins", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-legacy-init-"))
  try {
    mkdirSync(join(root, "src"), { recursive: true })
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(join(root, "src/main.tsx"), 'import React from "react"')
    writeFileSync(
      join(root, "vite.config.ts"),
      `import babel from "@rolldown/plugin-babel"
import yopemBabelConfig from "./babel.config.cjs"
import { fileURLToPath as yopemFileURLToPath } from "node:url"
const yopemSource = yopemFileURLToPath(new URL("./src", import.meta.url))
export default { plugins: [babel({ plugins: yopemBabelConfig.plugins })], resolve: { alias: { "@": yopemSource } } }`,
    )
    writeFileSync(
      join(root, "babel.config.cjs"),
      'module.exports = { plugins: [["@stylexjs/babel-plugin", { runtimeInjection: false }]] }',
    )
    writeFileSync(
      join(root, "postcss.config.cjs"),
      'const babelConfig = require("./babel.config.cjs")\nmodule.exports = { plugins: { "@stylexjs/postcss-plugin": { babelConfig: babelConfig.plugins }, autoprefixer: {} } }',
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
    const config = readFileSync(join(root, "vite.config.ts"), "utf8")
    expect(config.match(/babel\(\{/g)).toHaveLength(1)
    expect(config).not.toContain("yopemBabelConfig")
    expect(config).toContain(
      'yopemCreateRequire(import.meta.url)("autoprefixer")',
    )
    expect(existsSync(join(root, "babel.config.cjs"))).toBe(false)
    expect(existsSync(join(root, "postcss.config.cjs"))).toBe(false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("CLI refuses customized StyleX options rather than discarding them", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-custom-stylex-config-"))
  try {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(
      join(root, "vite.config.ts"),
      "export default { plugins: [] }",
    )
    const custom =
      'module.exports = { plugins: [["@stylexjs/babel-plugin", { aliases: { "~/*": ["./src/*"] } }]] }'
    writeFileSync(join(root, "babel.config.cjs"), custom)
    await expect(initProject({ cwd: root })).rejects.toThrow(
      "Unsupported Babel config in babel.config.cjs",
    )
    expect(readFileSync(join(root, "babel.config.cjs"), "utf8")).toBe(custom)
    expect(readFileSync(join(root, "vite.config.ts"), "utf8")).toBe(
      "export default { plugins: [] }",
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("CLI preserves unsupported dynamic configuration without changes", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem-dynamic-postcss-"))
  try {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
    )
    writeFileSync(join(root, "tsconfig.json"), "{}")
    writeFileSync(
      join(root, "vite.config.ts"),
      "export default { plugins: [] }",
    )
    const custom = "module.exports = { plugins: makePlugins() }"
    writeFileSync(join(root, "postcss.config.cjs"), custom)
    await expect(initProject({ cwd: root })).rejects.toThrow(
      "Unsupported PostCSS config in postcss.config.cjs",
    )
    expect(readFileSync(join(root, "vite.config.ts"), "utf8")).toBe(
      "export default { plugins: [] }",
    )
    expect(readFileSync(join(root, "postcss.config.cjs"), "utf8")).toBe(custom)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

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
