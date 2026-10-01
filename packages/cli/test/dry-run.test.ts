import { afterAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"

import type { InstallOptions } from "@/install"

import { runCli } from "@/cli"
import { initProject } from "@/init"
import { installItem } from "@/install"

import { snapshot } from "./files"

const results = resolve(import.meta.dirname, "../test-results")

const evidence: object[] = []

const paths = [
  "src/lib/shared.ts",
  "src/components/ui/button.tsx",
  "src/lib/button.ts",
]

function registryItem(name: string, files: Record<string, string>) {
  return {
    schemaVersion: 1,
    registryVersion: "1.0.0",
    type: "registry:lib",
    name,
    title: name,
    description: name,
    categories: [],
    dependencies: name === "shared" ? ["react"] : ["@stylexjs/stylex", "react"],
    devDependencies: ["typescript", "react"],
    peerDependencies: [],
    registryDependencies: name === "button" ? ["shared"] : [],
    files: Object.entries(files).map(([path, content]) => ({
      path: `lib/${basename(path)}`,
      target: `@/${path.slice(4)}`,
      type: "registry:lib",
      content,
      integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
    })),
  }
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "yopem-dry-run-"))
  const calls: { args: string[]; cwd: string }[] = []
  const requests: string[] = []
  const items = new Map<string, ReturnType<typeof registryItem>>()

  function put(path: string, content: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), content)
  }

  function version(value: number) {
    items.set(
      "shared",
      registryItem("shared", {
        [paths[0]!]: `export const shared = ${value}\n`,
      }),
    )
    items.set(
      "button",
      registryItem("button", {
        [paths[1]!]: `import { shared } from "@/lib/shared"\nexport const button = shared + ${value}\n`,
        [paths[2]!]: `export const helper = ${value}\n`,
      }),
    )
  }

  version(1)
  put("package.json", '{"name":"app","dependencies":{"react":"*"}}\n')
  put("tsconfig.json", "{}\n")
  put("vite.config.ts", "export default { plugins: [] }\n")
  put("src/main.tsx", 'import React from "react"\n')
  put("bun.lock", "original lock\n")
  put("node_modules/untouched.txt", "original dependency\n")
  mkdirSync(join(root, "empty"))

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname
      requests.push(path)
      const item = items.get(basename(path, ".json"))

      return item
        ? Response.json(item)
        : new Response("Not found", { status: 404 })
    },
  })

  function run(args: string[], cwd: string) {
    calls.push({ args, cwd })

    return Promise.resolve()
  }

  function unchanged(name: string, before: ReturnType<typeof snapshot>) {
    const after = snapshot(root)
    expect(after).toEqual(before)
    expect(calls).toEqual([])
    evidence.push({ name, before, after, calls: [...calls] })
  }

  function dispose() {
    server.stop(true)
    rmSync(root, { recursive: true, force: true })
  }

  const options = { cwd: root, registryUrl: `${server.url}r`, run }

  return {
    root,
    calls,
    requests,
    items,
    options,
    put,
    version,
    unchanged,
    dispose,
  }
}

async function preview(
  project: ReturnType<typeof fixture>,
  name: string,
  options: InstallOptions = {},
) {
  project.calls.length = 0
  const before = snapshot(project.root)

  const result = await installItem("button", {
    ...project.options,
    ...options,
    dryRun: true,
  })

  project.unchanged(name, before)
  expect(result.installed).toBe(0)
  expect(result.preview).toBeDefined()
  evidence.push({ name: `${name} plan`, result })

  return result
}

afterAll(() => {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    join(results, "step5-dry-run.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
})

test("new dry add validates dependencies, plans all writes and matches real install", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    const result = await preview(project, "new add")
    expect(existsSync(join(project.root, "ui.json"))).toBe(false)
    expect(project.requests).toEqual(["/r/button.json", "/r/shared.json"])
    expect(result.skipped).toBe(0)
    expect(result.preview?.files).toEqual(
      [...paths, "ui.json"].map((path) => ({ path, action: "write" })),
    )
    expect(result.preview?.dependencies).toEqual(["react", "@stylexjs/stylex"])
    expect(result.preview?.devDependencies).toEqual(["typescript"])
    expect(await installItem("button", project.options)).toEqual({
      installed: 3,
      skipped: 0,
    })
    expect(project.calls).toEqual([
      { args: ["add", ...result.preview!.dependencies], cwd: project.root },
      {
        args: ["add", "-d", ...result.preview!.devDependencies],
        cwd: project.root,
      },
    ])
    expect(
      snapshot(project.root)
        .filter(
          (entry) =>
            entry.content !== null &&
            !before.some(
              (old) => old.path === entry.path && old.content === entry.content,
            ),
        )
        .map((entry) => entry.path)
        .sort(),
    ).toEqual(result.preview!.files.map((file) => file.path).sort())
  } finally {
    project.dispose()
  }
})

for (const mode of ["add", "update"] as const) {
  for (const state of [
    "new",
    "identical",
    "upgrade",
    "modified",
    "untracked",
    "mixed",
  ] as const) {
    test(`dry ${mode} lists all ${state} file decisions and preserves project`, async () => {
      const project = fixture()

      try {
        if (state !== "untracked" && state !== "new")
          await installItem("button", project.options)

        if (state === "upgrade") project.version(2)

        if (
          state === "modified" ||
          state === "mixed" ||
          state === "untracked"
        ) {
          for (const path of paths) project.put(path, `local edit: ${path}\n`)
        }

        if (state === "mixed") {
          const manifest: { version: number; files: Record<string, string> } =
            JSON.parse(readFileSync(join(project.root, "ui.json"), "utf8"))

          delete manifest.files[paths[2]!]
          project.put("ui.json", `${JSON.stringify(manifest)}\n`)
        }

        const before = snapshot(project.root)
        const result = await preview(project, `${state} ${mode}`, { mode })

        const action =
          state === "untracked" ||
          ((state === "modified" || state === "mixed") && mode === "update")
            ? "conflict"
            : state === "new" || (state === "upgrade" && mode === "update")
              ? "write"
              : "skip"

        expect(
          result.preview?.files
            .slice(0, 3)
            .map((file) => ({ path: file.path, action: file.action })),
        ).toEqual(
          paths.map((path, index) => ({
            path,
            action: state === "mixed" && index === 2 ? "conflict" : action,
          })),
        )

        if (state === "modified") {
          for (const file of result.preview!.files.slice(0, 3))
            expect(file.reason).toContain("Modified file:")
        }

        if (state === "untracked" || state === "new")
          expect(existsSync(join(project.root, "ui.json"))).toBe(false)

        const conflicts = result.preview!.files.filter(
          (file) => file.action === "conflict",
        )

        if (conflicts.length) {
          await expect(
            installItem("button", { ...project.options, mode }),
          ).rejects.toThrow(/Modified file:|Existing file:/)
          project.unchanged(`real ${state} ${mode} rejected`, before)
        } else {
          expect(
            await installItem("button", { ...project.options, mode }),
          ).toEqual({
            installed: action === "write" ? 3 : 0,
            skipped: action === "write" ? 0 : 3,
          })

          if (action === "skip") expect(snapshot(project.root)).toEqual(before)
        }
      } finally {
        project.dispose()
      }
    })
  }
}

for (const mode of ["add", "update"] as const) {
  for (const tracked of [false, true]) {
    test(`dry ${mode} force marks every overwrite (tracked=${tracked}) and matches real install`, async () => {
      const project = fixture()

      try {
        if (tracked) await installItem("button", project.options)

        for (const path of paths) project.put(path, "local edit\n")
        const options = { mode, force: true }

        const result = await preview(
          project,
          `force ${mode} tracked=${tracked}`,
          options,
        )

        expect(result.preview?.files.slice(0, 3)).toEqual(
          paths.map((path) => ({ path, action: "write", forced: true })),
        )
        expect(
          result.preview?.files.some((file) => file.action === "conflict"),
        ).toBe(false)
        expect(
          await installItem("button", { ...project.options, ...options }),
        ).toEqual({ installed: 3, skipped: 0 })
      } finally {
        project.dispose()
      }
    })
  }
}

test("dry force does not mark identical files as overwrites", async () => {
  const project = fixture()

  try {
    await installItem("button", project.options)
    const result = await preview(project, "identical force", { force: true })
    expect(result.skipped).toBe(3)
    expect(
      result.preview?.files.every(
        (file) => file.action === "skip" && !file.forced,
      ),
    ).toBe(true)
  } finally {
    project.dispose()
  }
})

test("dry shared package persists no new manifest and reuses tracked import prefix", async () => {
  const project = fixture()
  project.put("package.json", '{"private":true,"workspaces":["packages/*"]}\n')
  project.put("packages/ui/package.json", '{"name":"@acme/ui"}\n')
  project.put("packages/ui/tsconfig.json", "{}\n")

  const options = {
    cwd: join(project.root, "packages/ui"),
    importPrefix: "@acme/ui",
  }

  try {
    await preview(project, "shared new add", options)
    expect(existsSync(join(options.cwd, "ui.json"))).toBe(false)
    await installItem("button", { ...project.options, ...options })
    expect(readFileSync(join(options.cwd, paths[1]!), "utf8")).toContain(
      'from "@acme/ui/lib/shared"',
    )
    project.calls.length = 0
    project.version(2)
    const before = snapshot(project.root)

    const result = await runCli(
      ["update", "button", "--dry-run", "--cwd", "packages/ui"],
      project.options,
    )

    project.unchanged("shared CLI update", before)
    expect(
      result &&
        "preview" in result &&
        result.preview?.files
          .slice(0, 3)
          .every((file) => file.action === "write"),
    ).toBe(true)
    await installItem("button", {
      ...project.options,
      cwd: options.cwd,
      mode: "update",
    })
    expect(readFileSync(join(options.cwd, paths[1]!), "utf8")).toContain(
      'from "@acme/ui/lib/shared"',
    )
  } finally {
    project.dispose()
  }
})

for (const failure of [
  "integrity",
  "schema",
  "target",
  "cycle",
  "registry-conflict",
  "symlink",
  "manifest",
  "URL",
] as const) {
  test(`dry add still rejects ${failure} without mutations`, async () => {
    const project = fixture()
    const item = project.items.get("shared")!
    const file = item.files[0]!
    let expected = ""
    let registryUrl = project.options.registryUrl

    if (failure === "integrity") {
      file.content = "tampered\n"
      expected = "Integrity mismatch"
    } else if (failure === "schema") {
      item.schemaVersion = 99
      expected = "Invalid registry item"
    } else if (failure === "target") {
      file.target = "@/../escape.ts"
      expected = "Unsafe registry path"
    } else if (failure === "cycle") {
      item.registryDependencies = ["button"]
      expected = "Cyclic registry dependency"
    } else if (failure === "registry-conflict") {
      project.items.get("button")!.files[0]!.target = file.target
      expected = "Conflicting registry files"
    } else if (failure === "symlink") {
      mkdirSync(join(project.root, "src/lib"))
      symlinkSync(
        join(project.root, "package.json"),
        join(project.root, paths[0]!),
      )
      expected = "Unsafe existing path"
    } else if (failure === "manifest") {
      project.put("ui.json", '{"version":99,"files":{}}\n')
      expected = "Invalid ui.json"
    } else {
      registryUrl = "http://registry.example/r"
      expected = "Invalid registry URL"
    }

    const before = snapshot(project.root)

    try {
      await expect(
        installItem("button", {
          ...project.options,
          registryUrl,
          dryRun: true,
        }),
      ).rejects.toThrow(expected)
      project.unchanged(`validation ${failure}`, before)

      if (failure === "URL" || failure === "manifest")
        expect(project.requests).toEqual([])
    } finally {
      project.dispose()
    }
  })
}

test("dry add retains registry timeout protection", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    await expect(
      installItem("button", {
        ...project.options,
        dryRun: true,
        requestTimeoutMs: 20,
        fetcher: () => Promise.withResolvers<Response>().promise,
      }),
    ).rejects.toThrow("Registry request timed out")
    project.unchanged("dry timeout", before)
  } finally {
    project.dispose()
  }
})

test("CLI options honor dryRun and reject init spread-through", async () => {
  const project = fixture()
  const options = { ...project.options, dryRun: true }
  const before = snapshot(project.root)

  try {
    await runCli(["add", "button"], options)
    project.unchanged("CLI programmatic dryRun", before)
    const requests = [...project.requests]
    await expect(runCli(["init"], options)).rejects.toThrow(/dry-run.*init/i)
    expect(project.requests).toEqual(requests)
    project.unchanged("CLI init dryRun option", before)
  } finally {
    project.dispose()
  }
})

for (const args of [
  ["--dry-run"],
  ["add", "--dry-run"],
  ["update", "button", "--dry-run", "true"],
  ["add", "button", "--dry-run", "--dry-run"],
  ["add", "button", "--dry-run=true"],
  ["init", "--dry-run"],
  ["init", "--dry-run", "--ui", "packages/ui"],
]) {
  test(`dry CLI argument rule: ${args.join(" ")}`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    try {
      await expect(runCli(args, project.options)).rejects.toThrow(
        /Usage:|dry-run.*init/i,
      )
      project.unchanged(args.join(" "), before)
      expect(project.requests).toEqual([])
    } finally {
      project.dispose()
    }
  })
}

for (const cwd of ["valid", "missing"]) {
  test(`programmatic init rejects dryRun before reads or mutations (${cwd})`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    try {
      await expect(
        initProject({
          ...project.options,
          cwd: cwd === "valid" ? project.root : join(project.root, "missing"),
          dryRun: true,
        }),
      ).rejects.toThrow(/dry-run.*init/i)
      project.unchanged(`programmatic init ${cwd}`, before)
      expect(project.requests).toEqual([])
    } finally {
      project.dispose()
    }
  })
}

for (const state of ["new", "conflicts", "force"] as const) {
  test(`CLI dry preview prints ${state} decisions, never Installed, and writes nothing`, async () => {
    const project = fixture()

    if (state !== "new")
      for (const path of paths) project.put(path, "untracked edit\n")
    const before = snapshot(project.root)

    try {
      const child = Bun.spawn(
        [
          "bun",
          resolve(import.meta.dirname, "../src/cli.ts"),
          state === "new" ? "add" : "update",
          "--dry-run",
          "button",
          "--registry",
          project.options.registryUrl,
          ...(state === "force" ? ["--force"] : []),
        ],
        { cwd: project.root, stdout: "pipe", stderr: "pipe", timeout: 10_000 },
      )

      const [status, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])

      expect(status, stderr).toBe(0)
      expect(stderr).toBe("")
      expect(stdout).toContain("No files written")
      expect(stdout).not.toContain("Installed ")
      expect(stdout).toContain("Runtime dependencies: react, @stylexjs/stylex")
      expect(stdout).toContain("Dev dependencies: typescript")

      for (const path of paths) expect(stdout).toContain(path)

      if (state === "conflicts")
        expect(stdout.match(/Conflict /g)).toHaveLength(3)

      if (state === "force")
        expect(stdout.match(/forced overwrite/g)).toHaveLength(3)
      project.unchanged(`CLI ${state}`, before)
      evidence.push({ name: `CLI ${state} output`, status, stdout, stderr })
    } finally {
      project.dispose()
    }
  })
}
