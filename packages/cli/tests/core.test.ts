import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, test } from "node:test"

import {
  detectProject,
  hash,
  integrity,
  resolveGraph,
  rewriteAliases,
  type RegistryItem,
} from "#core"

const temporary: string[] = []
const project = (files: Record<string, string>) => {
  const root = join(tmpdir(), `yopem-ui-${randomUUID()}`)
  mkdirSync(root)
  temporary.push(root)
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return root
}

afterEach(() =>
  temporary
    .splice(0)
    .forEach((path) => rmSync(path, { recursive: true, force: true })),
)

describe("resolveGraph", () => {
  const item = (
    name: string,
    registryDependencies: string[] = [],
  ): RegistryItem => ({
    dependencies: [],
    devDependencies: [],
    files: [],
    name,
    peerDependencies: [],
    registryDependencies,
  })

  test("orders dependencies once", () => {
    const items = new Map(
      [
        item("button", ["utils", "icon"]),
        item("icon", ["utils"]),
        item("utils"),
      ].map((value) => [value.name, value]),
    )
    assert.deepEqual(
      resolveGraph(["button"], items).map(({ name }) => name),
      ["utils", "icon", "button"],
    )
  })

  test("reports dependency cycles", () => {
    const items = new Map(
      [item("a", ["b"]), item("b", ["a"])].map((value) => [value.name, value]),
    )
    assert.throws(() => resolveGraph(["a"], items), /a -> b -> a/)
  })
})

test("hash and integrity use SHA256", () => {
  assert.equal(
    hash("hello"),
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  )
  assert.equal(
    integrity("hello"),
    "sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=",
  )
})

test("rewriteAliases rewrites supported prefixes only", () => {
  assert.equal(
    rewriteAliases(
      'import { cn } from "@lib/utils"\nimport x from "@other/x"',
      {
        ui: "~/ui",
        lib: "~/lib/",
        hooks: "~/hooks",
        styles: "~/styles",
        components: "~/components",
      },
    ),
    'import { cn } from "~/lib/utils"\nimport x from "@other/x"',
  )
})

describe("detectProject", () => {
  test("detects TanStack Start, bun, and workspace", () => {
    const root = project({
      "package.json": JSON.stringify({
        dependencies: { "@tanstack/react-start": "1" },
        workspaces: ["packages/*"],
      }),
      "bun.lock": "",
    })
    assert.deepEqual(detectProject(root), {
      framework: "tanstack-start",
      manager: "bun",
      workspace: true,
    })
  })

  test("distinguishes Next app and pages", () => {
    const app = project({
      "package.json": JSON.stringify({ dependencies: { next: "15" } }),
      "app/page.tsx": "",
    })
    const pages = project({
      "package.json": JSON.stringify({ dependencies: { next: "15" } }),
      "pages/index.tsx": "",
    })
    assert.equal(detectProject(app).framework, "next-app")
    assert.equal(detectProject(pages).framework, "next-pages")
  })

  test("detects Vite and pnpm", () => {
    const root = project({
      "package.json": JSON.stringify({ devDependencies: { vite: "6" } }),
      "pnpm-lock.yaml": "",
    })
    assert.deepEqual(detectProject(root), {
      framework: "vite",
      manager: "pnpm",
      workspace: false,
    })
  })

  test("detects Yarn", () => {
    const root = project({
      "package.json": JSON.stringify({ devDependencies: { vite: "6" } }),
      "yarn.lock": "",
    })
    assert.equal(detectProject(root).manager, "yarn")
  })

  test("finds a package manager and workspace in a parent", () => {
    const root = project({
      "apps/web/package.json": JSON.stringify({
        devDependencies: { vite: "8" },
      }),
      "package-lock.json": "{}",
      "package.json": JSON.stringify({ workspaces: ["apps/*"] }),
    })
    assert.deepEqual(detectProject(join(root, "apps/web")), {
      framework: "vite",
      manager: "npm",
      workspace: true,
    })
  })
})
