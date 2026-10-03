import { afterAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

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
