import { afterAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { runCli } from "@/cli"
import { initProject } from "@/init"
import { installItem } from "@/install"

import { snapshot } from "./files"

const evidence: object[] = []

const results = resolve(import.meta.dirname, "../test-results")

function item(
  name: string,
  dependencies: string[] = [],
  devDependencies: string[] = [],
  registryDependencies: string[] = [],
) {
  const path = name === "base" ? "styles/styles.css" : `lib/${name}.ts`
  const content = name === "base" ? "@stylex;\n" : "export const value = 1\n"

  return {
    schemaVersion: 1,
    registryVersion: "1.0.0",
    type: "registry:lib",
    name,
    title: name,
    description: name,
    categories: [],
    dependencies,
    devDependencies,
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
  const root = mkdtempSync(join(tmpdir(), "yopem-improvements-"))
  const calls: { args: string[]; cwd: string }[] = []

  const items = new Map([
    ["base", item("base")],
    ["button", item("button")],
  ])

  const requests: string[] = []

  function put(path: string, text: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), text)
  }

  put(
    "package.json",
    JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
  )
  put("tsconfig.json", "{}")
  put("vite.config.ts", "export default { plugins: [] }\n")
  put("src/main.tsx", 'import React from "react"\n')

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname
      requests.push(path)
      const value = items.get(path.split("/").at(-1)!.replace(".json", ""))

      return value ? Response.json(value) : new Response(null, { status: 404 })
    },
  })

  const options = {
    cwd: root,
    registryUrl: `${server.url}r`,
    run(args: string[], cwd: string) {
      calls.push({ args, cwd })

      return Promise.resolve()
    },
  }

  function dispose() {
    server.stop(true)
    rmSync(root, { recursive: true, force: true })
  }

  return { root, calls, items, requests, put, options, dispose }
}

afterAll(() => {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    join(results, "cli-improvements.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
})

for (const [existing, requirement, pending] of [
  [null, "react", true],
  ["*", "react", false],
  ["^19.0.0", "react", false],
  ["19.1.0", "react@^19.0.0", false],
  ["^19.1.0", "react@^19.0.0", false],
  ["~19.1.0", "react@^19.0.0", false],
  ["^19.1", "react@^19.0.0", false],
  ["~19.1", "react@^19.0.0", false],
  ["19.x", "react@^19.0.0", false],
  ["19.1.x", "react@~19.1.0", false],
  ["^0", "react@^0.1.0", true],
  ["^0.0", "react@~0.0.0", false],
  ["19.0.0-beta.1", "react@>=19.0.0-beta.0 <20.0.0", false],
  ["^18.0.0", "react@^19.0.0", true],
  ["*", "react@^19.0.0", true],
  ["latest", "react@^19.0.0", true],
  ["^0.19.1", "@stylexjs/stylex@^0.19.0", false],
  ["^0.18.0", "@stylexjs/stylex@^0.19.0", true],
  ["^19.0.0", "react@~19.0.0", true],
  ["workspace:*", "@acme/ui@workspace:*", false],
] as const) {
  test(`pending dependencies: ${existing} versus ${requirement}`, async () => {
    const project = fixture()

    const name = requirement.startsWith("@")
      ? requirement.split("@").slice(0, 2).join("@")
      : "react"

    project.put(
      "package.json",
      JSON.stringify({ dependencies: existing ? { [name]: existing } : {} }),
    )
    project.items.set("button", item("button", [requirement]))
    const before = snapshot(project.root)

    try {
      const dry = await installItem("button", {
        ...project.options,
        dryRun: true,
      })

      expect(dry.preview?.dependencies).toEqual(pending ? [requirement] : [])
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
      await installItem("button", project.options)
      expect(project.calls.map((call) => call.args)).toEqual(
        pending ? [["add", requirement]] : [],
      )
      evidence.push({
        name: `dependency ${existing}/${requirement}`,
        dry,
        calls: project.calls,
      })
    } finally {
      project.dispose()
    }
  })
}

test("runtime precedence by package name, dev promotion, repeated no-op and workspace target", async () => {
  const project = fixture()
  project.put(
    "package.json",
    JSON.stringify({
      workspaces: ["packages/*"],
      dependencies: { react: "19.1.0" },
    }),
  )
  project.put(
    "packages/ui/package.json",
    JSON.stringify({
      name: "@acme/ui",
      devDependencies: { react: "19.1.0" },
      dependencies: { "@stylexjs/stylex": "^0.19.1" },
    }),
  )
  project.items.set(
    "button",
    item(
      "button",
      ["react@^19.0.0", "@stylexjs/stylex@^0.19.0"],
      ["react@^19.1.0"],
    ),
  )
  const cwd = join(project.root, "packages/ui")

  try {
    const dry = await installItem("button", {
      ...project.options,
      cwd,
      dryRun: true,
    })

    expect(dry.preview?.dependencies).toEqual(["react@19.1.0"])
    expect(dry.preview?.devDependencies).toEqual([])
    await installItem("button", { ...project.options, cwd })
    expect(project.calls).toEqual([{ args: ["add", "react@19.1.0"], cwd }])
    project.put(
      "packages/ui/package.json",
      JSON.stringify({
        name: "@acme/ui",
        dependencies: { react: "^19.1.0", "@stylexjs/stylex": "^0.19.1" },
      }),
    )
    project.calls.length = 0
    const before = snapshot(project.root)
    await installItem("button", { ...project.options, cwd, mode: "update" })
    expect(snapshot(project.root)).toEqual(before)
    expect(project.calls).toEqual([])
  } finally {
    project.dispose()
  }
})

for (const manifest of [
  "[]",
  '{"dependencies":[]}',
  '{"dependencies":{"react":42}}',
  '{"devDependencies":null}',
  "{",
]) {
  test(`malformed package manifest rejected before writes: ${manifest}`, async () => {
    const project = fixture()
    project.put("package.json", manifest)
    const before = snapshot(project.root)

    try {
      await expect(installItem("button", project.options)).rejects.toThrow()
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
    } finally {
      project.dispose()
    }
  })
}

for (const framework of [
  "vite",
  "tanstack-router",
  "tanstack-start",
  "react-router",
  "next",
  "astro",
] as const) {
  for (const shared of [false, true]) {
    test(`init dry run ${framework}, shared=${shared}, plans validated base and config`, async () => {
      const project = fixture()

      const dependency = {
        vite: "vite",
        "tanstack-router": "@tanstack/react-router",
        "tanstack-start": "@tanstack/react-start",
        "react-router": "@react-router/dev",
        next: "next",
        astro: "astro",
      }[framework]

      project.put(
        "package.json",
        JSON.stringify({
          dependencies: { [dependency]: "*", react: "*" },
          scripts: { dev: "next dev", build: "next build" },
        }),
      )

      if (framework === "astro") {
        project.put("astro.config.mjs", "export default { integrations: [] }\n")
        project.put(
          "src/layouts/Layout.astro",
          "---\n---\n<html><head></head><body></body></html>",
        )
      } else if (framework === "next") {
        project.put(
          "src/app/layout.tsx",
          "export function Layout(){ return <html><body></body></html> }",
        )
      } else if (
        framework === "tanstack-start" ||
        framework === "react-router"
      ) {
        project.put(
          framework === "tanstack-start"
            ? "src/routes/__root.tsx"
            : "app/root.tsx",
          "export function Layout(){ return <html><head></head><body></body></html> }",
        )
      }

      if (shared) {
        project.put(
          "package.json",
          JSON.stringify({
            workspaces: ["packages/*"],
            dependencies: { [dependency]: "*", react: "*" },
            scripts: { dev: "next dev", build: "next build" },
          }),
        )
        project.put(
          "packages/ui/package.json",
          '{"name":"@acme/ui","sideEffects":false}',
        )
      }

      const before = snapshot(project.root)

      try {
        const result = await initProject({
          ...project.options,
          framework,
          dryRun: true,
          ...(shared && { ui: "packages/ui" }),
        })

        expect(result.preview).toBeDefined()

        if (framework === "next") {
          expect(
            result.preview?.files.find(
              (file) => file.path === join(project.root, "package.json"),
            )?.reason,
          ).toContain("next build --webpack")
        }

        if (shared) {
          expect(
            result.preview?.files.find(
              (file) =>
                file.path === join(project.root, "packages/ui/package.json"),
            )?.reason,
          ).toContain("./components/ui/*")
        }

        expect(
          result.preview?.files.some(
            (file) =>
              file.path ===
                join(
                  shared ? join(project.root, "packages/ui") : project.root,
                  "src/styles/styles.css",
                ) && file.action === "write",
          ),
        ).toBe(true)
        expect(
          result.preview?.dependencies.some(
            (group) =>
              group.cwd === project.root &&
              group.devDependencies.includes("@stylexjs/babel-plugin@^0.19.0"),
          ),
        ).toBe(true)
        expect(snapshot(project.root)).toEqual(before)
        expect(project.calls).toEqual([])
        evidence.push({
          name: `init ${framework} shared=${shared}`,
          result,
          unchanged: true,
        })
      } finally {
        project.dispose()
      }
    })
  }
}

test("init dry run lists retired deletion and rejects base without @stylex before mutation", async () => {
  const project = fixture()
  project.put(".babelrc", '{"plugins":[]}')
  const before = snapshot(project.root)

  try {
    const result = await runCli(["init", "--dry-run"], project.options)
    expect(
      result &&
        "framework" in result &&
        result.preview?.files.some(
          (file) =>
            file.path === join(project.root, ".babelrc") &&
            file.action === "delete",
        ),
    ).toBe(true)
    expect(snapshot(project.root)).toEqual(before)
    const base = project.items.get("base")!
    base.files[0]!.content = "/* missing directive */\n"
    base.files[0]!.integrity = `sha256-${createHash("sha256").update(base.files[0]!.content).digest("base64")}`

    for (const dryRun of [true, false]) {
      await expect(initProject({ ...project.options, dryRun })).rejects.toThrow(
        "Add @stylex;",
      )
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
    }
  } finally {
    project.dispose()
  }
})

test("provenance tracks transitive and overlapping owners, warns registry switch and retains skipped origins", async () => {
  const project = fixture()
  const button = project.items.get("button")!
  button.registryDependencies.push("shared")
  const shared = item("shared")
  shared.files = [...button.files]
  shared.registryVersion = "2.0.0"
  project.items.set("shared", shared)

  try {
    await installItem("button", project.options)

    const tracked = JSON.parse(
      readFileSync(join(project.root, "ui.json"), "utf8"),
    )

    expect(tracked.provenance["src/lib/button.ts"]).toEqual({
      registryUrl: project.options.registryUrl,
      items: { shared: "2.0.0", button: "1.0.0" },
    })
    const before = snapshot(project.root)
    const registryUrl = project.options.registryUrl.replace("/r", "/other")
    const warnings: string[] = []

    const dry = await installItem("button", {
      ...project.options,
      registryUrl,
      mode: "update",
      dryRun: true,
    })

    expect(dry.warnings?.[0]).toContain("different registry")
    expect(snapshot(project.root)).toEqual(before)
    project.put("src/lib/button.ts", "local modification\n")

    const skipped = await installItem("button", {
      ...project.options,
      registryUrl,
      onWarning(warning) {
        warnings.push(warning)
      },
    })

    expect(skipped.warnings).toEqual(warnings)
    expect(
      JSON.parse(readFileSync(join(project.root, "ui.json"), "utf8"))
        .provenance,
    ).toEqual(tracked.provenance)
    expect(warnings[0]).toContain(project.options.registryUrl)
    // Applied update records new origins, warning delivered before file commit.
    await installItem("button", {
      ...project.options,
      registryUrl,
      force: true,
      mode: "update",
      onWarning() {
        expect(
          readFileSync(join(project.root, "src/lib/button.ts"), "utf8"),
        ).toBe("local modification\n")
      },
    })
    expect(
      JSON.parse(readFileSync(join(project.root, "ui.json"), "utf8"))
        .provenance["src/lib/button.ts"].registryUrl,
    ).toBe(registryUrl)
  } finally {
    project.dispose()
  }
})

test("legacy ui.json migrates only applied/identical files; no-op preserves custom formatting", async () => {
  const project = fixture()

  try {
    await installItem("button", project.options)

    const manifest = JSON.parse(
      readFileSync(join(project.root, "ui.json"), "utf8"),
    )

    delete manifest.provenance
    project.put("ui.json", JSON.stringify(manifest))
    await installItem("button", project.options)
    expect(
      JSON.parse(readFileSync(join(project.root, "ui.json"), "utf8"))
        .provenance,
    ).toBeDefined()
    project.put(
      "ui.json",
      JSON.stringify(
        JSON.parse(readFileSync(join(project.root, "ui.json"), "utf8")),
      ),
    )
    const before = snapshot(project.root)
    await installItem("button", project.options)
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    project.dispose()
  }
})

for (const provenance of [
  null,
  [],
  {
    "src/lib/button.ts": {
      registryUrl: "https://user:secret@example.com/r",
      items: { button: "1" },
    },
  },
  {
    "src/lib/button.ts": {
      registryUrl: "https://example.com/r",
      items: { button: 42 },
    },
  },
  {
    "src/lib/unknown.ts": {
      registryUrl: "https://example.com/r",
      items: { button: "1" },
    },
  },
]) {
  test(`invalid provenance rejected: ${JSON.stringify(provenance)}`, async () => {
    const project = fixture()

    try {
      await installItem("button", project.options)

      const manifest = JSON.parse(
        readFileSync(join(project.root, "ui.json"), "utf8"),
      )

      project.put("ui.json", JSON.stringify({ ...manifest, provenance }))
      project.calls.length = 0
      const before = snapshot(project.root)
      await expect(installItem("button", project.options)).rejects.toThrow(
        "Invalid ui.json",
      )
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
    } finally {
      project.dispose()
    }
  })
}

for (const command of ["add", "update", "init"] as const) {
  for (const destination of [
    "local",
    "http://remote.invalid/unsafe",
    "https://user:secret@remote.invalid/unsafe",
  ]) {
    test(`${command} rejects late native redirect to ${destination} without destination request or mutation`, async () => {
      const project = fixture()
      let contacted = 0

      const sink = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch() {
          contacted++

          return Response.json(item("broken"))
        },
      })

      const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch(request) {
          const name = new URL(request.url).pathname
            .split("/")
            .at(-1)!
            .replace(".json", "")

          if (name === "broken")
            return new Response("secret body", {
              status: 302,
              headers: {
                Location:
                  destination === "local" ? `${sink.url}target` : destination,
              },
            })
          const value = item(name)
          value.registryDependencies.push("broken")

          return Response.json(value)
        },
      })

      const before = snapshot(project.root)

      try {
        const message = await runCli(
          [command, ...(command === "init" ? [] : ["button"])],
          { ...project.options, registryUrl: `${server.url}r` },
        ).then(
          () => "unexpected success",
          (cause: unknown) =>
            cause instanceof Error ? cause.message : String(cause),
        )

        expect(message).toMatch(/network|redirect/i)
        expect(message).toContain("--registry")
        expect(message).not.toContain("secret")
        expect(contacted).toBe(0)
        expect(snapshot(project.root)).toEqual(before)
        expect(project.calls).toEqual([])
        evidence.push({
          name: `${command} redirect ${destination}`,
          message,
          contacted,
          unchanged: true,
        })
      } finally {
        server.stop(true)
        sink.stop(true)
        project.dispose()
      }
    })
  }
}

test("injected redirect rejected; fetch receives redirect:error and abort signal", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    await expect(
      installItem("button", {
        ...project.options,
        fetcher(_url, init) {
          expect(init?.redirect).toBe("error")
          expect(init?.signal).toBeInstanceOf(AbortSignal)

          return Promise.resolve(
            new Response("secret body", {
              status: 307,
              headers: { Location: "https://user:secret@remote.invalid" },
            }),
          )
        },
      }),
    ).rejects.toThrow(/redirect.*--registry/i)
    expect(snapshot(project.root)).toEqual(before)
    expect(project.calls).toEqual([])
  } finally {
    project.dispose()
  }
})

test("init registry switch exposes warnings before commit in real and dry results", async () => {
  const project = fixture()

  try {
    await initProject(project.options)
    const registryUrl = project.options.registryUrl.replace("/r", "/other")
    const before = snapshot(project.root)

    const dry = await initProject({
      ...project.options,
      registryUrl,
      dryRun: true,
    })

    expect(dry.warnings?.[0]).toContain("different registry")
    expect(snapshot(project.root)).toEqual(before)
    const warnings: string[] = []

    const real = await initProject({
      ...project.options,
      registryUrl,
      onWarning(warning) {
        warnings.push(warning)
      },
    })

    expect(real.warnings).toEqual(warnings)
    expect(warnings).toHaveLength(1)
  } finally {
    project.dispose()
  }
})

test("incompatible runtime/dev requirements fail before package-manager or file writes", async () => {
  const project = fixture()
  project.items.set(
    "button",
    item("button", ["react@^18.0.0"], ["react@^19.0.0"]),
  )
  const before = snapshot(project.root)

  try {
    await expect(installItem("button", project.options)).rejects.toThrow(
      "Conflicting package requirements",
    )
    expect(snapshot(project.root)).toEqual(before)
    expect(project.calls).toEqual([])
  } finally {
    project.dispose()
  }
})

test("identical tracked files keep applied item versions when fetched version changes", async () => {
  const project = fixture()

  try {
    await installItem("button", project.options)
    const before = snapshot(project.root)
    project.items.get("button")!.registryVersion = "9.0.0"

    const result = await installItem("button", {
      ...project.options,
      mode: "update",
    })

    expect(result.installed).toBe(0)
    expect(snapshot(project.root)).toEqual(before)
    expect(
      JSON.parse(readFileSync(join(project.root, "ui.json"), "utf8"))
        .provenance["src/lib/button.ts"].items.button,
    ).toBe("1.0.0")
  } finally {
    project.dispose()
  }
})

for (const existing of [false, true]) {
  for (const dryRun of [false, true]) {
    test(`init validates conflicting base/tool requirements before effects: existing=${existing}, dry=${dryRun}`, async () => {
      const project = fixture()
      project.items.set("base", item("base", ["@babel/core@^8.0.0"]))
      project.put(
        "package.json",
        JSON.stringify({
          dependencies: {
            vite: "*",
            react: "*",
            ...(existing && { "@babel/core": "^8.0.0" }),
          },
        }),
      )
      const before = snapshot(project.root)

      try {
        await expect(
          initProject({ ...project.options, dryRun }),
        ).rejects.toThrow("Conflicting package requirements")
        expect(snapshot(project.root)).toEqual(before)
        expect(project.calls).toEqual([])
      } finally {
        project.dispose()
      }
    })
  }

  test(`init compatible base/tool overlap preserves runtime precedence without reinstall: existing=${existing}`, async () => {
    const project = fixture()
    project.items.set(
      "base",
      item("base", ["@babel/core@^7.29.7"], ["@babel/core@^7.29.7"]),
    )
    project.put(
      "package.json",
      JSON.stringify({
        dependencies: {
          vite: "*",
          react: "*",
          ...(existing && { "@babel/core": "^7.30.0" }),
        },
      }),
    )
    const before = snapshot(project.root)

    try {
      const dry = await initProject({ ...project.options, dryRun: true })
      const group = dry.preview?.dependencies[0]
      expect(
        group?.dependencies.filter((argument) =>
          argument.startsWith("@babel/core@"),
        ),
      ).toEqual(existing ? [] : ["@babel/core@^7.29.7"])
      expect(
        group?.devDependencies.some((argument) =>
          argument.startsWith("@babel/core@"),
        ),
      ).toBe(false)
      expect(snapshot(project.root)).toEqual(before)
      await initProject({
        ...project.options,
        async run(args, cwd) {
          await project.options.run(args, cwd)

          const value: {
            dependencies: Record<string, string>
            devDependencies?: Record<string, string>
          } = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"))

          const dev = args.includes("-d")

          if (dev) value.devDependencies ??= {}
          const target = dev ? value.devDependencies! : value.dependencies

          for (const argument of args.slice(dev ? 2 : 1)) {
            const separator = argument.indexOf("@", 1)
            target[separator < 0 ? argument : argument.slice(0, separator)] =
              separator < 0 ? "*" : argument.slice(separator + 1)
          }

          project.put("package.json", JSON.stringify(value))
        },
      })
      expect(
        project.calls.flatMap((call) =>
          call.args.filter((argument) => argument.startsWith("@babel/core@")),
        ),
      ).toEqual(existing ? [] : ["@babel/core@^7.29.7"])
      expect(
        project.calls
          .filter((call) => call.args.includes("-d"))
          .every(
            (call) =>
              !call.args.some((argument) =>
                argument.startsWith("@babel/core@"),
              ),
          ),
      ).toBe(true)
    } finally {
      project.dispose()
    }
  })
}

test("init shared UI does not merge requirements across separate package targets", async () => {
  const project = fixture()
  project.items.set("base", item("base", ["@babel/core@^8.0.0"]))
  project.put(
    "package.json",
    JSON.stringify({
      workspaces: ["packages/*"],
      dependencies: { vite: "*", react: "*", "@babel/core": "^7.30.0" },
    }),
  )
  project.put(
    "packages/ui/package.json",
    JSON.stringify({
      name: "@acme/ui",
      dependencies: { "@babel/core": "^8.0.0" },
    }),
  )
  const before = snapshot(project.root)

  try {
    const dry = await initProject({
      ...project.options,
      ui: "packages/ui",
      dryRun: true,
    })

    expect(dry.preview?.dependencies.map((group) => group.cwd)).toEqual([
      join(project.root, "packages/ui"),
      project.root,
    ])
    expect(
      dry.preview?.dependencies.every((group) =>
        [...group.dependencies, ...group.devDependencies].every(
          (argument) => !argument.startsWith("@babel/core@"),
        ),
      ),
    ).toBe(true)
    expect(snapshot(project.root)).toEqual(before)
    await initProject({ ...project.options, ui: "packages/ui" })
    expect(
      project.calls.every(
        (call) =>
          !call.args.some((argument) => argument.startsWith("@babel/core@")),
      ),
    ).toBe(true)
  } finally {
    project.dispose()
  }
})

for (const existing of [false, true]) {
  test(`init applies narrowed tooling requirement as runtime with preview parity: existing=${existing}`, async () => {
    const project = fixture()
    project.items.set("base", item("base", ["@babel/core@^7.0.0"]))
    project.put(
      "package.json",
      JSON.stringify({
        dependencies: {
          vite: "*",
          react: "*",
          ...(existing && { "@babel/core": "^7.0.0" }),
        },
      }),
    )
    const before = snapshot(project.root)

    const configBefore = readFileSync(
      join(project.root, "vite.config.ts"),
      "utf8",
    )

    try {
      const dry = await initProject({ ...project.options, dryRun: true })
      const group = dry.preview?.dependencies[0]

      if (!group) throw new Error("Missing init preview dependency group")
      expect(group.dependencies).toEqual(["@babel/core@^7.29.7"])
      expect(
        group?.devDependencies.some((argument) =>
          argument.startsWith("@babel/core@"),
        ),
      ).toBe(false)
      expect(snapshot(project.root)).toEqual(before)
      await initProject({
        ...project.options,
        async run(args, cwd) {
          await project.options.run(args, cwd)
          expect(
            readFileSync(join(project.root, "vite.config.ts"), "utf8"),
          ).toBe(configBefore)

          const value: {
            dependencies: Record<string, string>
            devDependencies?: Record<string, string>
          } = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"))

          const dev = args.includes("-d")

          if (dev) {
            expect(
              readFileSync(join(project.root, "src/styles/styles.css"), "utf8"),
            ).toContain("@stylex;")
            value.devDependencies ??= {}
          }

          const target = dev ? value.devDependencies! : value.dependencies

          for (const argument of args.slice(dev ? 2 : 1)) {
            const separator = argument.indexOf("@", 1)
            const name = separator < 0 ? argument : argument.slice(0, separator)
            target[name] = separator < 0 ? "*" : argument.slice(separator + 1)

            if (dev) delete value.dependencies[name]
            else if (value.devDependencies) delete value.devDependencies[name]
          }

          project.put("package.json", JSON.stringify(value))
        },
      })

      const runtime = project.calls
        .filter((call) => !call.args.includes("-d"))
        .flatMap((call) => call.args.slice(1))

      const dev = project.calls
        .filter((call) => call.args.includes("-d"))
        .flatMap((call) => call.args.slice(2))

      expect(runtime).toEqual(group.dependencies)
      expect(dev).toEqual(group.devDependencies)

      const manifest: {
        dependencies: Record<string, string>
        devDependencies: Record<string, string>
      } = JSON.parse(readFileSync(join(project.root, "package.json"), "utf8"))

      expect(manifest.dependencies["@babel/core"]).toBe("^7.29.7")
      expect(manifest.devDependencies["@babel/core"]).toBeUndefined()
      evidence.push({
        scenario: "init narrowed overlap parity",
        existing,
        preview: group,
        commands: project.calls,
      })
    } finally {
      project.dispose()
    }
  })
}
