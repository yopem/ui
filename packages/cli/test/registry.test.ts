import { afterAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { runCli } from "@/cli"
import { installItem } from "@/install"

const results = resolve(import.meta.dirname, "../test-results")

const logs: string[] = []

function item(name: string, version = 1, registryDependencies: string[] = []) {
  const content =
    name === "base" ? "@stylex;\n" : `export const value = ${version}\n`

  const path = name === "base" ? "styles/styles.css" : `lib/${name}.ts`

  return {
    schemaVersion: 1,
    registryVersion: "1.0.0",
    type: "registry:lib",
    name,
    title: name,
    description: name,
    categories: [],
    dependencies: ["react"],
    devDependencies: ["typescript"],
    peerDependencies: [],
    registryDependencies,
    files: [
      {
        path,
        target: `@/${path}`,
        type: "registry:lib",
        content,
        integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
      },
    ],
  }
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "yopem-registry-"))
  const calls: string[][] = []

  function put(path: string, content: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), content)
  }

  put(
    "package.json",
    JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
  )
  put("tsconfig.json", "{}\n")
  put("vite.config.ts", "export default { plugins: [] }\n")
  put("src/main.tsx", 'import React from "react"\n')
  put(".oxlintrc.json", "{}\n")
  put("bun.lock", "original lock\n")
  put("node_modules/untouched.txt", "original dependency\n")

  function snapshot() {
    return readdirSync(root, { recursive: true, encoding: "utf8" })
      .sort()
      .map((path) => ({
        path,
        content: statSync(join(root, path)).isFile()
          ? readFileSync(join(root, path)).toString("base64")
          : null,
      }))
  }

  function run(args: string[]) {
    calls.push(args)

    return Promise.resolve()
  }

  function dispose() {
    rmSync(root, { recursive: true, force: true })
  }

  return { root, calls, put, snapshot, run, dispose }
}

afterAll(() => {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    join(results, "step3-registry-workflows.log"),
    logs.join("\n\n"),
  )
})

test("CLI init, add and update use explicit local registry instead of programmatic default", async () => {
  const project = fixture()
  const requests: string[] = []
  let version = 1

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname
      requests.push(path)
      const name = path.split("/").at(-1)!.replace(".json", "")

      return Response.json(
        item(name, version, name === "button" ? ["shared"] : []),
      )
    },
  })

  const registryUrl = `${server.url}custom/r///`

  const options = {
    cwd: project.root,
    run: project.run,
    registryUrl: "https://unused.example/r",
  }

  try {
    await runCli(["init", "--registry", registryUrl], options)
    await runCli(["add", "button", "--registry", registryUrl], options)
    version = 2
    await runCli(["update", "button", "--registry", registryUrl], options)
    expect(requests).toEqual([
      "/custom/r/base.json",
      "/custom/r/button.json",
      "/custom/r/shared.json",
      "/custom/r/button.json",
      "/custom/r/shared.json",
    ])
    expect(
      readFileSync(join(project.root, "src/lib/button.ts"), "utf8"),
    ).toContain("value = 2")
    expect(
      readFileSync(join(project.root, "src/lib/shared.ts"), "utf8"),
    ).toContain("value = 2")
    expect(readFileSync(join(project.root, "ui.json"), "utf8")).toContain(
      "src/lib/button.ts",
    )
    expect(readdirSync(project.root)).not.toContain(".yopem-ui.json")
    expect(project.calls.length).toBeGreaterThan(0)
    logs.push(
      `Local init/add/update override: ${requests.join(", ")}\nUpdated both files; ui.json tracked; dependency commands: ${project.calls.length}`,
    )
  } finally {
    server.stop(true)
    project.dispose()
  }
})

test("InstallOptions.registryUrl works with native fetch", async () => {
  const project = fixture()
  const requests: string[] = []

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      requests.push(new URL(request.url).pathname)

      return Response.json(item("button"))
    },
  })

  try {
    await installItem("button", {
      cwd: project.root,
      run: project.run,
      registryUrl: `${server.url}r`,
    })
    expect(requests).toEqual(["/r/button.json"])
    expect(
      readFileSync(join(project.root, "src/lib/button.ts"), "utf8"),
    ).toContain("value = 1")
    logs.push(`Programmatic registry override: ${requests.join(", ")}`)
  } finally {
    server.stop(true)
    project.dispose()
  }
})

for (const failure of [
  "headers-timeout",
  "body-timeout",
  "bad-json",
  "http-status",
  "body-network",
] as const) {
  for (const command of ["init", "add", "update"] as const) {
    test(`${command} ${failure} on late dependency leaves source, config and dependencies untouched`, async () => {
      const project = fixture()
      const requests: string[] = []

      const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch(request) {
          const path = new URL(request.url).pathname
          requests.push(path)
          const name = path.split("/").at(-1)!.replace(".json", "")

          if (name !== "broken") {
            return Response.json(
              item(name, 2, name === "shared" ? [] : ["shared", "broken"]),
            )
          }

          if (failure === "headers-timeout")
            return Promise.withResolvers<Response>().promise

          if (failure === "bad-json")
            return new Response('{"secret":"do-not-print",', {
              headers: { "Content-Type": "application/json" },
            })

          if (failure === "http-status")
            return new Response("do-not-print", {
              status: 503,
            })

          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode("{"))

                if (failure === "body-network") {
                  setTimeout(
                    () => controller.error(new Error("do-not-print")),
                    10,
                  )
                }
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          )
        },
        error() {
          return new Response(null, { status: 500 })
        },
      })

      const requestTimeoutMs = 150
      const before = project.snapshot()
      const start = performance.now()

      try {
        const message = await runCli(
          [
            command,
            ...(command === "init" ? [] : ["button"]),
            "--registry",
            `${server.url}r`,
          ],
          {
            cwd: project.root,
            run: project.run,
            requestTimeoutMs,
            ...(command === "add" &&
              failure.endsWith("timeout") && {
                fetcher(url: string) {
                  return fetch(url)
                },
              }),
          },
        ).then(
          () => "unexpected success",
          (cause: unknown) =>
            cause instanceof Error ? cause.message : String(cause),
        )

        const elapsed = performance.now() - start
        expect(message).toContain("broken.json")
        expect(message).toContain("--registry")
        expect(message).not.toContain("do-not-print")

        if (failure.endsWith("timeout")) {
          expect(message).toMatch(/timed out.*150\s?ms/i)
          expect(elapsed).toBeLessThan(2_000)
        } else if (failure === "bad-json") {
          expect(message).toMatch(/malformed JSON/i)
        } else if (failure === "http-status") {
          expect(message).toContain("HTTP 503")
        } else {
          expect(message).toMatch(/network/i)
        }

        expect(requests.map((path) => path.split("/").at(-1))).toEqual([
          `${command === "init" ? "base" : "button"}.json`,
          "shared.json",
          "broken.json",
        ])
        expect(project.calls).toEqual([])
        expect(project.snapshot()).toEqual(before)
        logs.push(
          `${command} ${failure}: ${message}\nElapsed ${Math.round(elapsed)}ms; all files/directories unchanged; no package-manager calls; requests: ${requests.join(", ")}`,
        )
      } finally {
        server.stop(true)
        project.dispose()
      }
    })
  }
}

for (const command of ["init", "add", "update"]) {
  test(`${command} connection failure is actionable and has no side effects`, async () => {
    const project = fixture()

    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response(),
    })

    const registryUrl = `${server.url}r`
    server.stop(true)
    const before = project.snapshot()

    try {
      await expect(
        runCli(
          [
            command,
            ...(command === "init" ? [] : ["button"]),
            "--registry",
            registryUrl,
          ],
          {
            cwd: project.root,
            run: project.run,
            requestTimeoutMs: 150,
          },
        ),
      ).rejects.toThrow(/network[\s\S]*--registry/i)
      expect(project.calls).toEqual([])
      expect(project.snapshot()).toEqual(before)
      logs.push(
        `${command} refused connection: actionable network error; no file or dependency changes`,
      )
    } finally {
      project.dispose()
    }
  })
}

for (const [registryUrl, expected] of [
  [undefined, "https://ui.yopem.com/r/button.json"],
  ["https://registry.example/r", "https://registry.example/r/button.json"],
  [
    "HTTPS://REGISTRY.EXAMPLE:443/nested/r///",
    "https://registry.example/nested/r/button.json",
  ],
  ["https://registry.example", "https://registry.example/button.json"],
  ["http://localhost:3100/r/", "http://localhost:3100/r/button.json"],
  ["http://127.0.0.1:3100/r", "http://127.0.0.1:3100/r/button.json"],
  ["http://127.1/r", "http://127.0.0.1/r/button.json"],
  ["http://2130706433/r", "http://127.0.0.1/r/button.json"],
  ["http://[::1]:3100/r", "http://[::1]:3100/r/button.json"],
] as const) {
  test(`registry URL accepts ${registryUrl ?? "production default"} and keeps one-argument fetchers compatible`, async () => {
    const project = fixture()
    const requests: string[] = []

    try {
      await installItem("button", {
        cwd: project.root,
        run: project.run,
        registryUrl,
        fetcher(url: string) {
          requests.push(url)

          return Promise.resolve(Response.json(item("button")))
        },
      })
      expect(requests).toEqual([expected])
    } finally {
      project.dispose()
    }
  })
}

for (const registryUrl of [
  "",
  "not a URL",
  "/r",
  "//registry.example/r",
  "https://",
  "https://registry.example:99999/r",
  "ftp://registry.example/r",
  "file:///r",
  "javascript:alert(1)",
  "http://registry.example/r",
  "http://192.168.1.1/r",
  "http://0.0.0.0/r",
  "http://localhost.evil.example/r",
  "http://127.0.0.1.evil.example/r",
  "http://localhost@evil.example/r",
  "https://private-user:private-password@registry.example/r",
  "http://private-user:private-password@localhost/r",
  "https://registry.example/r?token=private-query",
  "https://registry.example/r#private-fragment",
  "https://registry.example/r?",
  "https://registry.example/r#",
]) {
  test(`registry URL rejects ${registryUrl} before network or writes`, async () => {
    const project = fixture()
    const before = project.snapshot()
    let requests = 0

    try {
      const message = await installItem("button", {
        cwd: project.root,
        run: project.run,
        registryUrl,
        fetcher() {
          requests++

          return Promise.resolve(Response.json(item("button")))
        },
      }).then(
        () => "unexpected success",
        (cause: unknown) =>
          cause instanceof Error ? cause.message : String(cause),
      )

      expect(message).toMatch(/registry.*URL[\s\S]*HTTPS/i)
      expect(message).not.toMatch(
        /private-user|private-password|private-query|private-fragment/,
      )
      expect(requests).toBe(0)
      expect(project.calls).toEqual([])
      expect(project.snapshot()).toEqual(before)
    } finally {
      project.dispose()
    }
  })
}

test("injected network errors do not leak credentials or response details", async () => {
  const project = fixture()
  const before = project.snapshot()

  try {
    const message = await installItem("button", {
      cwd: project.root,
      run: project.run,
      fetcher(_url: string, init?: RequestInit) {
        expect(init?.signal).toBeInstanceOf(AbortSignal)
        expect(init?.signal?.aborted).toBe(false)

        return Promise.reject(
          new Error("https://private-user:private-password@registry.example/r"),
        )
      },
    }).then(
      () => "unexpected success",
      (cause: unknown) =>
        cause instanceof Error ? cause.message : String(cause),
    )

    expect(message).toMatch(/network[\s\S]*--registry/i)
    expect(message).not.toMatch(/private-user|private-password/)
    expect(project.snapshot()).toEqual(before)
    expect(project.calls).toEqual([])
  } finally {
    project.dispose()
  }
})

for (const args of [
  ["init", "--registry"],
  ["add", "button", "--registry"],
  ["update", "button", "--registry", "--force"],
  [
    "init",
    "--registry",
    "https://one.example/r",
    "--registry",
    "https://two.example/r",
  ],
]) {
  test(`registry flag rejects missing or duplicate values: ${args.join(" ")}`, async () => {
    await expect(runCli(args)).rejects.toThrow("Usage:")
  })
}

for (const requestTimeoutMs of [0, -1, 1.5, NaN, Infinity, 2_147_483_648]) {
  test(`invalid request timeout ${requestTimeoutMs} fails before network`, async () => {
    const project = fixture()
    let requests = 0

    try {
      await expect(
        installItem("button", {
          cwd: project.root,
          requestTimeoutMs,
          run: project.run,
          fetcher() {
            requests++

            return Promise.resolve(Response.json(item("button")))
          },
        }),
      ).rejects.toThrow(/timeout/i)
      expect(requests).toBe(0)
      expect(project.calls).toEqual([])
    } finally {
      project.dispose()
    }
  })
}
