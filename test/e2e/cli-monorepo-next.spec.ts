import { runCli } from "@cli/cli"
import { expect, test } from "@playwright/test"
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

for (const framework of ["next", "astro", "tanstack-start"] as const) {
  test(`shared UI setup supports ${framework}`, async () => {
    const root = mkdtempSync(join(tmpdir(), "yopem-shared-init-"))

    function put(path: string, content: string) {
      mkdirSync(join(root, path, ".."), { recursive: true })
      writeFileSync(join(root, path), content)
    }

    const dependency =
      framework === "tanstack-start" ? "@tanstack/react-start" : framework

    const config =
      framework === "next"
        ? "next.config.mjs"
        : framework === "astro"
          ? "astro.config.mjs"
          : "vite.config.ts"

    const layout =
      framework === "next"
        ? "src/app/layout.tsx"
        : framework === "astro"
          ? "src/layouts/Layout.astro"
          : "src/routes/__root.tsx"

    try {
      put(
        "package.json",
        JSON.stringify({ workspaces: ["apps/*", "packages/*"] }),
      )
      put(
        "apps/web/package.json",
        JSON.stringify({
          name: "web",
          dependencies: { [dependency]: "*", react: "*" },
          scripts: { dev: "next dev", build: "next build" },
        }),
      )
      put("apps/web/tsconfig.json", "{}")
      put(`apps/web/${config}`, "export default {}")
      put(
        `apps/web/${layout}`,
        framework === "astro"
          ? "<html><head></head><body>Hi</body></html>"
          : 'import React from "react"\nexport default function Root(){return <html><head></head><body>Hi</body></html>}',
      )
      put(
        "packages/ui/package.json",
        JSON.stringify({ name: "@acme/ui", private: true }),
      )
      put("packages/ui/tsconfig.json", "{}")

      function run() {
        return Promise.resolve()
      }

      function fetcher(url: string) {
        return Promise.resolve(
          new Response(
            readFileSync(
              join(
                process.cwd(),
                "packages/registry/dist/r",
                new URL(url).pathname.split("/").at(-1)!,
              ),
              "utf8",
            ),
          ),
        )
      }

      const args = ["init", "--cwd", "apps/web", "--ui", "../../packages/ui"]
      await runCli(args, { cwd: root, run, fetcher })
      const configured = readFileSync(join(root, `apps/web/${config}`), "utf8")
      expect(readFileSync(join(root, `apps/web/${layout}`), "utf8")).toContain(
        "@acme/ui/styles/styles.css",
      )

      if (framework === "next") {
        expect(configured).toContain('transpilePackages: ["@acme/ui"]')
        expect(
          readFileSync(join(root, "apps/web/babel.config.js"), "utf8"),
        ).toContain('"@acme/ui/*"')
        expect(
          readFileSync(join(root, "apps/web/postcss.config.cjs"), "utf8"),
        ).toContain("../../packages/ui/src")
      } else {
        expect(configured).toContain('"@acme/ui/*"')
        expect(configured).toContain("yopemUISource")
      }

      await runCli(args, { cwd: root, run, fetcher })
      expect(readFileSync(join(root, `apps/web/${config}`), "utf8")).toBe(
        configured,
      )
      await test.info().attach(`${framework}-shared-config`, {
        body: configured,
        contentType: "text/plain",
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}
