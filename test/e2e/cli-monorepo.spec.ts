import { runCli } from "@cli/cli"
import { packageRunner } from "@cli/project"
import { expect, test } from "@playwright/test"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "yopem-monorepo-"))

  function put(path: string, content: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), content)
  }

  put(
    "package.json",
    JSON.stringify({
      private: true,
      workspaces: ["apps/*", "packages/*"],
      packageManager: "pnpm@10.0.0",
    }),
  )
  put("pnpm-lock.yaml", "lockfileVersion: '9.0'\n")
  put(
    "apps/web/package.json",
    JSON.stringify({ name: "web", dependencies: { react: "*", vite: "*" } }),
  )
  put("apps/web/tsconfig.json", "{}")
  put("apps/web/vite.config.ts", "export default { plugins: [] }")
  put("apps/web/src/main.tsx", 'import React from "react"')
  put(
    "packages/ui/package.json",
    JSON.stringify({
      name: "@acme/ui",
      private: true,
      type: "module",
      sideEffects: false,
    }),
  )
  put("packages/ui/tsconfig.json", "{}")

  const calls: { args: string[]; cwd: string }[] = []

  function run(args: string[], cwd: string) {
    calls.push({ args, cwd })

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

  return { root, put, calls, run, fetcher }
}

test("CLI targets workspace app without changing root", async () => {
  const { root, calls, run, fetcher } = fixture()
  const before = readFileSync(join(root, "package.json"), "utf8")

  try {
    await runCli(["init", "--cwd", "apps/web"], { cwd: root, run, fetcher })
    expect(calls.every((call) => call.cwd === join(root, "apps/web"))).toBe(
      true,
    )
    expect(readFileSync(join(root, "package.json"), "utf8")).toBe(before)
    expect(
      readFileSync(join(root, "apps/web/src/styles/styles.css"), "utf8"),
    ).toContain("@stylex;")
    await expect(
      runCli(["add", "button", "--cwd"], { cwd: root, run, fetcher }),
    ).rejects.toThrow("Usage:")
    await expect(
      runCli(["init", "--cwd", "apps/web", "--cwd", "apps/web"], {
        cwd: root,
        run,
        fetcher,
      }),
    ).rejects.toThrow("Usage:")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("shared UI init, add, repeat and modified update stay workspace-local", async () => {
  const { root, put, calls, run, fetcher } = fixture()

  try {
    put(
      "apps/web/package.json",
      JSON.stringify({
        name: "web",
        dependencies: { react: "*", vite: "*", "@acme/ui": "^99.0.0" },
      }),
    )
    await runCli(["init", "--cwd", "apps/web", "--ui", "../../packages/ui"], {
      cwd: root,
      run,
      fetcher,
    })
    const config = readFileSync(join(root, "apps/web/vite.config.ts"), "utf8")
    expect(config).toContain('"@acme/ui/*"')
    expect(config).toContain("../../packages/ui/src")
    expect(readFileSync(join(root, "apps/web/src/main.tsx"), "utf8")).toContain(
      'from "@acme/ui/styles/tokens.stylex"',
    )

    const manifest = JSON.parse(
      readFileSync(join(root, "packages/ui/package.json"), "utf8"),
    )

    expect(manifest.sideEffects).toEqual(["**/*.css"])
    expect(manifest.exports["./components/ui/*"]).toBe(
      "./src/components/ui/*.tsx",
    )
    expect(manifest.exports["./styles/tokens.stylex"]).toBe(
      "./src/styles/tokens.stylex.ts",
    )
    expect(calls.some((call) => call.cwd === join(root, "packages/ui"))).toBe(
      true,
    )
    expect(
      calls.some(
        (call) =>
          call.cwd === join(root, "apps/web") &&
          call.args.includes("@acme/ui@workspace:*"),
      ),
    ).toBe(true)
    await runCli(["add", "button", "--cwd", "packages/ui"], {
      cwd: root,
      run,
      fetcher,
    })

    const button = readFileSync(
      join(root, "packages/ui/src/components/ui/button.tsx"),
      "utf8",
    )

    expect(button).toContain("@acme/ui/lib/stylex")
    expect(button).not.toContain('"@/')
    await runCli(["init", "--cwd", "apps/web", "--ui", "../../packages/ui"], {
      cwd: root,
      run,
      fetcher,
    })
    expect(readFileSync(join(root, "apps/web/vite.config.ts"), "utf8")).toBe(
      config,
    )
    put("packages/ui/src/components/ui/button.tsx", `${button}\n`)
    await expect(
      runCli(["update", "button", "--cwd", "packages/ui"], {
        cwd: root,
        run,
        fetcher,
      }),
    ).rejects.toThrow("Modified file:")
    await runCli(["update", "button", "--force", "--cwd", "packages/ui"], {
      cwd: root,
      run,
      fetcher,
    })
    expect(
      readFileSync(
        join(root, "packages/ui/src/components/ui/button.tsx"),
        "utf8",
      ),
    ).toBe(button)
    await test
      .info()
      .attach("shared-vite-config", { body: config, contentType: "text/plain" })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("workspace manager conflicts and unrelated shared packages fail before writes", async () => {
  const { root, put, calls, run, fetcher } = fixture()

  try {
    put("apps/web/bun.lock", "")
    await expect(packageRunner(join(root, "apps/web"))).rejects.toThrow(
      "Package manager",
    )
    put("packages/ui/package.json", JSON.stringify({ name: "invalid/name" }))
    await expect(
      runCli(["init", "--cwd", "apps/web", "--ui", "../../packages/ui"], {
        cwd: root,
        run,
        fetcher,
      }),
    ).rejects.toThrow("package name")
    expect(calls).toHaveLength(0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const manager of ["npm", "pnpm", "yarn"] as const) {
  test(`${manager} runner inherits workspace manager and uses target cwd`, () => {
    const { root, put } = fixture()

    try {
      put(
        "package.json",
        JSON.stringify({
          workspaces: ["apps/*", "packages/*"],
          packageManager: `${manager}@1.0.0`,
        }),
      )
      rmSync(join(root, "pnpm-lock.yaml"))
      put(
        `bin/${manager}`,
        '#!/bin/sh\nprintf "%s\\n" "$PWD" "$@" > "$CLI_COMMAND_LOG"\n',
      )
      chmodSync(join(root, `bin/${manager}`), 0o755)
      const output = join(root, "command.log")
      const script = `import { packageRunner } from ${JSON.stringify(join(process.cwd(), "packages/cli/src/project.ts"))}; const run = await packageRunner(${JSON.stringify(join(root, "apps/web"))}); await run(["add", "-d", "@acme/ui@workspace:*"], ${JSON.stringify(join(root, "apps/web"))});`

      const result = spawnSync("bun", ["-e", script], {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${join(root, "bin")}:${process.env.PATH}`,
          CLI_COMMAND_LOG: output,
        },
      })

      expect(result.status, result.stderr).toBe(0)
      expect(readFileSync(output, "utf8").trim().split("\n")).toEqual([
        join(root, "apps/web"),
        manager === "npm" ? "install" : "add",
        "-D",
        manager === "npm" ? "@acme/ui@*" : "@acme/ui@workspace:*",
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

test("pnpm YAML membership supports shared install and rejects excluded targets", async () => {
  const { root, put, calls, run, fetcher } = fixture()

  try {
    put("package.json", JSON.stringify({ packageManager: "pnpm@10.0.0" }))
    put(
      "pnpm-workspace.yaml",
      "packages:\n  - 'apps/*'\n  - 'packages/*'\n  - '!apps/private'\n",
    )
    await runCli(["init", "--cwd", "apps/web", "--ui", "../../packages/ui"], {
      cwd: root,
      run,
      fetcher,
    })
    expect(calls.some((call) => call.cwd === join(root, "packages/ui"))).toBe(
      true,
    )
    put(
      "apps/private/package.json",
      JSON.stringify({ dependencies: { react: "*", vite: "*" } }),
    )
    const before = calls.length
    await expect(
      runCli(["add", "button", "--cwd", "apps/private"], {
        cwd: root,
        run,
        fetcher,
      }),
    ).rejects.toThrow("Not a workspace member")
    expect(calls).toHaveLength(before)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const name of ["-unsafe", "@acme/ui;command"] as const) {
  test(`shared init rejects unsafe package name ${name}`, async () => {
    const { root, put, calls, run, fetcher } = fixture()

    try {
      put("packages/ui/package.json", JSON.stringify({ name }))
      await expect(
        runCli(["init", "--cwd", "apps/web", "--ui", "../../packages/ui"], {
          cwd: root,
          run,
          fetcher,
        }),
      ).rejects.toThrow("valid package name")
      expect(calls).toHaveLength(0)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

test("workspace root can also be a consuming app", async () => {
  const { root, put, run, fetcher } = fixture()

  try {
    put(
      "package.json",
      JSON.stringify({
        name: "web",
        workspaces: ["apps/*", "packages/*"],
        dependencies: { react: "*", vite: "*" },
      }),
    )
    put("tsconfig.json", "{}")
    put("vite.config.ts", "export default {}")
    put("src/main.tsx", 'import React from "react"')
    await runCli(["init", "--ui", "packages/ui"], { cwd: root, run, fetcher })
    expect(readFileSync(join(root, "src/main.tsx"), "utf8")).toContain(
      "@acme/ui/styles/tokens.stylex",
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
