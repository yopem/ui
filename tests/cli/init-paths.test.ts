import { initProject } from "@cli/init"
import { installItem } from "@cli/install"
import { expect, test } from "bun:test"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import ts from "typescript-api"

import { snapshot } from "./files"

const repositoryRoot = resolve(import.meta.dirname, "../..")

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "yopem-init-paths-"))

  function put(path: string, content: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), content)
  }

  function fetcher(url: string) {
    return Promise.resolve(
      new Response(
        readFileSync(
          join(
            repositoryRoot,
            "packages/registry/dist/r",
            new URL(url).pathname.split("/").at(-1)!,
          ),
          "utf8",
        ),
      ),
    )
  }

  function run() {
    return Promise.resolve()
  }

  return { root, put, fetcher, run }
}

for (const framework of ["vite", "next", "astro"] as const) {
  test(`init maps ${framework} root imports, lint and guidance outside src`, async () => {
    const { root, put, fetcher, run } = fixture()

    try {
      put(
        "package.json",
        JSON.stringify({
          dependencies: { react: "*", [framework]: "*" },
          scripts: { dev: "next dev", build: "next build" },
        }),
      )
      put("tsconfig.json", "{}")
      put(
        "ui.json",
        JSON.stringify({
          version: 1,
          files: {},
          paths: {
            ui: "design/widgets",
            styles: "design/styles",
            lib: "src/utils",
          },
        }),
      )

      const entry =
        framework === "next"
          ? "src/app/layout.tsx"
          : framework === "astro"
            ? "src/layouts/Layout.astro"
            : "src/main.tsx"

      put(
        entry,
        framework === "next"
          ? 'import React from "react"\nexport default function Layout(){return <html><body>Hi</body></html>}'
          : framework === "astro"
            ? "---\n---\n<html><head></head><body><slot /></body></html>"
            : 'import React from "react"',
      )

      if (framework !== "next")
        put(
          framework === "astro" ? "astro.config.mjs" : "vite.config.ts",
          "export default {}",
        )
      const options = { cwd: root, fetcher, run, guidance: "agents" as const }
      const before = snapshot(root)
      await initProject({ ...options, dryRun: true })
      expect(snapshot(root)).toEqual(before)
      await initProject(options)
      expect(readFileSync(join(root, entry), "utf8")).toContain(
        '"@/../design/styles/styles.css"',
      )
      expect(readFileSync(join(root, entry), "utf8")).toContain(
        '"@/../design/styles/tokens.stylex"',
      )
      expect(existsSync(join(root, "design/styles/tokens.stylex.ts"))).toBe(
        true,
      )
      expect(existsSync(join(root, "src/utils/stylex.ts"))).toBe(true)

      const lint = JSON.parse(
        readFileSync(join(root, ".oxlintrc.json"), "utf8"),
      )

      expect(
        lint.overrides.some((entry: { files: string[] }) =>
          entry.files.includes("design/widgets/**/*.{tsx,jsx}"),
        ),
      ).toBe(true)
      expect(lint.rules["yopem-ui/no-restyle"][1].componentSources).toContain(
        "@/../design/widgets/",
      )
      expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toContain(
        "@/../design/widgets/<name>",
      )

      if (framework === "next")
        expect(readFileSync(join(root, "babel.config.js"), "utf8")).toContain(
          "design/styles/tokens.stylex.ts",
        )
      else
        expect(
          readFileSync(
            join(
              root,
              framework === "astro" ? "astro.config.mjs" : "vite.config.ts",
            ),
            "utf8",
          ),
        ).toContain("design/styles/**/*.{js,jsx,ts,tsx}")
      const installed = snapshot(root)
      await initProject(options)
      expect(snapshot(root)).toEqual(installed)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

test("shared init maps package exports, root imports and guidance", async () => {
  const { root, put, fetcher, run } = fixture()

  try {
    put(
      "package.json",
      JSON.stringify({ private: true, workspaces: ["apps/*", "packages/*"] }),
    )
    put(
      "apps/web/package.json",
      JSON.stringify({
        dependencies: { react: "*", next: "*" },
        scripts: { dev: "next dev", build: "next build" },
      }),
    )
    put("apps/web/tsconfig.json", "{}")
    put(
      "apps/web/src/app/layout.tsx",
      'import React from "react"\nexport default function Layout(){return <html><body>Hi</body></html>}',
    )
    put(
      "packages/ui/package.json",
      JSON.stringify({ name: "@acme/ui", private: true }),
    )
    put(
      "packages/ui/ui.json",
      JSON.stringify({
        version: 1,
        files: {},
        paths: {
          components: "src/parts",
          ui: "src/widgets",
          hooks: "src/composables",
          lib: "src/utils",
          styles: "design/styles",
          theme: "src/themes",
        },
      }),
    )

    const options = {
      cwd: join(root, "apps/web"),
      ui: "../../packages/ui",
      fetcher,
      run,
      guidance: "agents" as const,
    }

    await initProject(options)

    const manifest = JSON.parse(
      readFileSync(join(root, "packages/ui/package.json"), "utf8"),
    )

    expect(manifest.exports["./src/widgets/*"]).toBe("./src/widgets/*.tsx")
    expect(manifest.exports["./src/composables/*"]).toBe(
      "./src/composables/*.ts",
    )
    expect(manifest.exports["./design/styles/styles.css"]).toBe(
      "./design/styles/styles.css",
    )
    expect(
      readFileSync(join(root, "apps/web/src/app/layout.tsx"), "utf8"),
    ).toContain('"@acme/ui/design/styles/styles.css"')
    expect(readFileSync(join(root, "apps/web/AGENTS.md"), "utf8")).toContain(
      "@acme/ui/src/widgets/<name>",
    )
    const installed = snapshot(root)
    await initProject(options)
    expect(snapshot(root)).toEqual(installed)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const source of [true, false]) {
  for (const framework of ["next", "vite"] as const) {
    test(`fresh ${framework} init detects ${source ? "src" : "root"} paths before writes`, async () => {
      const { root, put, fetcher, run } = fixture()

      try {
        put(
          "package.json",
          JSON.stringify({
            dependencies: { react: "*", [framework]: "*" },
            scripts: { dev: "next dev", build: "next build" },
          }),
        )
        put(
          "tsconfig.json",
          JSON.stringify({
            compilerOptions: { paths: { "@/*": [source ? "./src/*" : "./*"] } },
          }),
        )
        const entry = `${source ? "src/" : ""}${framework === "next" ? "app/layout.tsx" : "main.tsx"}`
        put(
          entry,
          framework === "next"
            ? 'import React from "react"\nexport default function Layout(){return <html><body>Hi</body></html>}'
            : 'import React from "react"',
        )

        if (framework === "vite")
          put(
            "vite.config.ts",
            source
              ? "export default {}"
              : 'export default { resolve: { alias: { "@": new URL(".", import.meta.url).pathname } } }',
          )
        const options = { cwd: root, fetcher, run }
        const before = snapshot(root)
        const preview = await initProject({ ...options, dryRun: true })
        expect(snapshot(root)).toEqual(before)
        const prefix = source ? "src/" : ""
        expect(
          preview.preview?.files.some(
            (file) =>
              file.path === join(root, `${prefix}styles/tokens.stylex.ts`),
          ),
        ).toBe(true)
        await initProject(options)
        const manifest = JSON.parse(readFileSync(join(root, "ui.json"), "utf8"))
        expect(manifest.sourceRoot).toBe(source ? "src" : ".")
        expect(manifest.paths).toEqual({
          components: `${prefix}components`,
          ui: `${prefix}components/ui`,
          hooks: `${prefix}hooks`,
          lib: `${prefix}lib`,
          styles: `${prefix}styles`,
          theme: `${prefix}themes`,
        })
        const specifier = "@/styles/tokens.stylex"
        expect(readFileSync(join(root, entry), "utf8")).toContain(
          JSON.stringify(specifier),
        )

        const config = ts.readConfigFile(join(root, "tsconfig.json"), (path) =>
          ts.sys.readFile(path),
        )

        const parsedConfig = ts.parseJsonConfigFileContent(
          config.config,
          ts.sys,
          root,
        )

        const module = ts.resolveModuleName(
          specifier,
          join(root, entry),
          {
            ...parsedConfig.options,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
          },
          ts.sys,
        )

        expect(module.resolvedModule?.resolvedFileName).toBe(
          join(root, `${prefix}styles/tokens.stylex.ts`),
        )
        expect(existsSync(join(root, "src"))).toBe(source)
        const installed = snapshot(root)
        await initProject(options)
        expect(snapshot(root)).toEqual(installed)
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    })
  }
}

test("init persists selected directories and keeps them on repeat init", async () => {
  const { root, put, fetcher, run } = fixture()

  try {
    put(
      "package.json",
      JSON.stringify({ dependencies: { react: "*", vite: "*" } }),
    )
    put("tsconfig.json", "{}")
    put("vite.config.ts", "export default {}")
    put("src/main.tsx", 'import React from "react"')

    const options = {
      cwd: root,
      fetcher,
      run,
      paths: {
        components: "design/components",
        ui: "design/controls",
        hooks: "design/hooks",
        lib: "design/lib",
        styles: "design/styles",
        theme: "design/themes",
      },
    }

    const before = snapshot(root)
    await initProject({ ...options, dryRun: true })
    expect(snapshot(root)).toEqual(before)
    await initProject(options)
    expect(
      JSON.parse(readFileSync(join(root, "ui.json"), "utf8")).paths,
    ).toEqual(options.paths)
    expect(existsSync(join(root, "design/styles/tokens.stylex.ts"))).toBe(true)
    const installed = snapshot(root)
    await initProject({ cwd: root, fetcher, run })
    expect(snapshot(root)).toEqual(installed)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const source of [true, false]) {
  test(`shared init detects ${source ? "src" : "root"} paths from UI package only`, async () => {
    const { root, put, fetcher, run } = fixture()

    try {
      put(
        "package.json",
        JSON.stringify({ private: true, workspaces: ["apps/*", "packages/*"] }),
      )
      put(
        "apps/web/package.json",
        JSON.stringify({
          dependencies: { react: "*", next: "*" },
          scripts: { dev: "next dev", build: "next build" },
        }),
      )
      put("apps/web/tsconfig.json", "{}")
      const entry = `apps/web/${source ? "" : "src/"}app/layout.tsx`
      put(
        entry,
        'import React from "react"\nexport default function Layout(){return <html><body>Hi</body></html>}',
      )
      put(
        "packages/ui/package.json",
        JSON.stringify({ name: "@acme/ui", private: true }),
      )

      if (source) put("packages/ui/src/index.ts", "export {}")

      const options = {
        cwd: join(root, "apps/web"),
        ui: "../../packages/ui",
        fetcher,
        run,
      }

      const before = snapshot(root)
      await initProject({ ...options, dryRun: true })
      expect(snapshot(root)).toEqual(before)
      await initProject(options)
      const prefix = source ? "src/" : ""

      const manifest = JSON.parse(
        readFileSync(join(root, "packages/ui/ui.json"), "utf8"),
      )

      expect(manifest.paths.styles).toBe(`${prefix}styles`)
      expect(manifest.paths.theme).toBe(`${prefix}themes`)
      expect(readFileSync(join(root, entry), "utf8")).toContain(
        '"@acme/ui/styles/styles.css"',
      )

      const pkg = JSON.parse(
        readFileSync(join(root, "packages/ui/package.json"), "utf8"),
      )

      expect(pkg.exports["./themes/*"]).toBe(`./${prefix}themes/*.tsx`)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

test("init preserves tracked legacy paths including singular theme", async () => {
  const { root, put, fetcher, run } = fixture()

  try {
    put(
      "package.json",
      JSON.stringify({ dependencies: { react: "*", vite: "*" } }),
    )
    put("tsconfig.json", "{}")
    put("vite.config.ts", "export default {}")
    put("src/main.tsx", 'import React from "react"')
    await installItem("base", { cwd: root, fetcher, run })
    const before = JSON.parse(readFileSync(join(root, "ui.json"), "utf8"))
    await initProject({ cwd: root, fetcher, run })
    const manifest = JSON.parse(readFileSync(join(root, "ui.json"), "utf8"))
    expect(manifest.paths?.theme ?? "src/theme").toBe("src/theme")
    expect(Object.keys(manifest.files)).toEqual(Object.keys(before.files))
    expect(existsSync(join(root, "src/styles/tokens.stylex.ts"))).toBe(true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
