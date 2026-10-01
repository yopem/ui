import type { AddressInfo } from "node:net"

import { expect, test } from "@playwright/test"
import { spawnSync } from "node:child_process"
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { extname, join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

function isTcpAddress(
  address: AddressInfo | string | null,
): address is AddressInfo {
  return (
    address !== null && Object.prototype.hasOwnProperty.call(address, "port")
  )
}

test("packed CLI builds and renders two apps sharing a real UI workspace", async ({
  page,
  request,
}) => {
  test.setTimeout(240_000)
  expect((await request.get("http://localhost:3100/r/button.json")).ok()).toBe(
    true,
  )
  const directory = mkdtempSync(join(tmpdir(), "yopem-monorepo-runtime-"))
  const workspace = join(directory, "workspace")
  const logs: string[] = []

  function put(path: string, content: string) {
    mkdirSync(join(workspace, path, ".."), { recursive: true })
    writeFileSync(join(workspace, path), content)
  }

  function run(cwd: string, ...args: string[]) {
    const result = spawnSync(args[0]!, args.slice(1), {
      cwd,
      encoding: "utf8",
      timeout: 120_000,
    })

    const output = `${result.stdout}${result.stderr}`
    logs.push(`${cwd}: ${args.join(" ")}\n${output}`)
    expect(result.status, output).toBe(0)
  }

  try {
    for (const name of ["cli", "oxlint-plugin"]) {
      run(
        join(root, "packages", name),
        "bun",
        "pm",
        "pack",
        "--destination",
        directory,
      )
    }

    const pluginArchive = readdirSync(directory).find(
      (name) => name.includes("oxlint-plugin") && name.endsWith(".tgz"),
    )

    if (!pluginArchive) throw new Error("Missing packed lint plugin")

    put(
      "package.json",
      JSON.stringify({
        name: "integration-monorepo",
        private: true,
        type: "module",
        packageManager: "bun@1.4.2",
        workspaces: ["apps/*", "packages/*"],
      }),
    )
    put(
      "packages/ui/package.json",
      JSON.stringify({
        name: "@integration/ui",
        private: true,
        type: "module",
        sideEffects: false,
        peerDependencies: { react: "^19.3.0", "react-dom": "^19.3.0" },
      }),
    )

    for (const name of ["web", "admin"]) {
      put(
        `apps/${name}/package.json`,
        JSON.stringify({
          name,
          private: true,
          type: "module",
          scripts: { build: "vite build" },
          devDependencies: {
            "@yopem-ui/oxlint-plugin": join(directory, pluginArchive),
          },
          dependencies: {
            vite: "^8.3.1",
            react: "^19.3.0",
            "react-dom": "^19.3.0",
          },
        }),
      )
      put(`apps/${name}/tsconfig.json`, "{}")
      put(`apps/${name}/vite.config.ts`, "export default {}")
      put(
        `apps/${name}/index.html`,
        '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Shared UI integration</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
      )
      put(
        `apps/${name}/src/main.tsx`,
        `import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "@integration/ui/components/ui/button"
export function App() {
  const [count, setCount] = useState(0)
  return <Button onClick={() => setCount(count + 1)}>${name} count: {count}</Button>
}
const target = document.getElementById("root")
if (!target) throw new Error("Missing root")
createRoot(target).render(<App />)
`,
      )
    }

    const before = readFileSync(join(workspace, "package.json"), "utf8")
    run(
      workspace,
      "bun",
      "add",
      "-d",
      ...readdirSync(directory)
        .filter((name) => name.endsWith(".tgz"))
        .map((name) => join(directory, name)),
    )
    const rootManifest = readFileSync(join(workspace, "package.json"), "utf8")
    expect(rootManifest).not.toBe(before)

    for (const name of ["web", "admin"]) {
      run(
        workspace,
        "bunx",
        "yopem-ui",
        "init",
        "--cwd",
        `apps/${name}`,
        "--ui",
        "../../packages/ui",
      )
      expect(
        readFileSync(join(workspace, `apps/${name}/package.json`), "utf8"),
      ).toContain('"@integration/ui": "workspace:*"')
    }

    run(workspace, "bunx", "yopem-ui", "add", "button", "--cwd", "packages/ui")
    run(
      workspace,
      "bunx",
      "yopem-ui",
      "update",
      "button",
      "--cwd",
      "packages/ui",
    )

    const buttonPath = join(
      workspace,
      "packages/ui/src/components/ui/button.tsx",
    )

    appendFileSync(buttonPath, "\n")
    const edited = readFileSync(buttonPath, "utf8")
    run(
      workspace,
      "bunx",
      "yopem-ui",
      "init",
      "--cwd",
      "apps/web",
      "--ui",
      "../../packages/ui",
    )
    expect(readFileSync(buttonPath, "utf8")).toBe(edited)
    expect(readFileSync(join(workspace, "package.json"), "utf8")).toBe(
      rootManifest,
    )

    for (const name of ["web", "admin"]) {
      expect(readdirSync(join(workspace, `apps/${name}/src`))).toEqual([
        "main.tsx",
      ])
      run(workspace, "bun", "run", "--cwd", `apps/${name}`, "build")
      const dist = join(workspace, `apps/${name}/dist`)

      const files = new Map(
        readdirSync(dist, { recursive: true, encoding: "utf8" })
          .filter((path) => extname(path))
          .map((path) => [`/${path}`, readFileSync(join(dist, path))]),
      )

      const server = createServer((incoming, response) => {
        const path = new URL(incoming.url ?? "/", "http://localhost").pathname
        const file = files.get(path === "/" ? "/index.html" : path)

        if (!file) {
          response.writeHead(404).end()

          return
        }

        const type = extname(path === "/" ? "/index.html" : path)
        response.setHeader(
          "content-type",
          type === ".js"
            ? "text/javascript"
            : type === ".css"
              ? "text/css"
              : "text/html",
        )
        response.end(file)
      })

      try {
        await new Promise<void>((done, reject) => {
          server.once("error", reject)
          server.listen(0, "127.0.0.1", done)
        })
        const address = server.address()

        if (!isTcpAddress(address))
          throw new Error("Expected TCP server address")
        const errors: string[] = []

        function onError(error: Error) {
          errors.push(error.message)
        }

        page.on("pageerror", onError)
        await page.goto(`http://127.0.0.1:${address.port}/`)
        const button = page.getByRole("button")
        await expect(button).toHaveAccessibleName(`${name} count: 0`)
        await expect(button).toBeVisible()
        await expect(button).toHaveCSS("display", "inline-flex")
        await expect(button).not.toHaveCSS(
          "background-color",
          "rgba(0, 0, 0, 0)",
        )
        await button.click()
        await expect(button).toHaveText(`${name} count: 1`)
        await button.press("Enter")
        await expect(button).toHaveText(`${name} count: 2`)
        await button.press("Space")
        await expect(button).toHaveText(`${name} count: 3`)
        expect(errors).toEqual([])
        await page.screenshot({
          path: test.info().outputPath(`${name}.png`),
          scale: "css",
        })
        await test.info().attach(`${name}.png`, {
          path: test.info().outputPath(`${name}.png`),
          contentType: "image/png",
        })
        page.off("pageerror", onError)
      } finally {
        await new Promise<void>((done, reject) =>
          server.close((error) => (error ? reject(error) : done())),
        )
      }
    }
  } finally {
    writeFileSync(
      join(root, "test-results/monorepo-runtime.log"),
      logs.join("\n\n"),
    )
    await test.info().attach("monorepo-runtime.log", {
      body: logs.join("\n\n"),
      contentType: "text/plain",
    })
    rmSync(directory, { recursive: true, force: true })
  }
})
