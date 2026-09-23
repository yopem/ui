import { installItem } from "@yopem-ui/cli/install"
import { afterEach, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true })
})

async function project() {
  const root = await mkdtemp(join(tmpdir(), "yopem-cli-"))
  roots.push(root)
  return root
}

function file(name: string, content: string) {
  return {
    path: `components/ui/${name}.tsx`,
    target: `@/components/ui/${name}.tsx`,
    type: "registry:ui",
    content,
    integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
  }
}

function item(
  name: string,
  content: string,
  registryDependencies: string[] = [],
) {
  return {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    name,
    type: "registry:ui",
    title: name,
    description: name,
    categories: [],
    dependencies: name === "button" ? ["@base-ui/react@^1.7.0"] : [],
    devDependencies: name === "base" ? ["@types/react@^19"] : [],
    peerDependencies: ["react@>=18 <20"],
    registryDependencies,
    files: [file(name, content)],
  }
}

function services(items: Map<string, ReturnType<typeof item>>) {
  const calls: string[][] = []
  const requested: string[] = []
  function fetcher(input: string) {
    const name = input.split("/").at(-1)?.replace(".json", "") ?? ""
    requested.push(name)
    const data = items.get(name)
    return Promise.resolve(
      new Response(data ? JSON.stringify(data) : "Not found", {
        status: data ? 200 : 404,
      }),
    )
  }
  function run(args: string[]) {
    calls.push(args)
    return Promise.resolve()
  }
  return { calls, requested, fetcher, run }
}

function fixture() {
  return new Map([
    ["base", item("base", "base")],
    ["spinner", item("spinner", "spinner", ["base"])],
    ["button", item("button", "button", ["base", "spinner"])],
  ])
}

test("add resolves transitive dependencies once and skips unchanged files", async () => {
  const cwd = await project()
  const api = services(fixture())
  expect(await installItem("button", { cwd, ...api })).toEqual({
    installed: 3,
    skipped: 0,
  })
  expect(api.requested).toEqual(["button", "base", "spinner"])
  expect(api.calls).toEqual([
    ["add", "@base-ui/react@^1.7.0"],
    ["add", "-d", "@types/react@^19"],
  ])
  expect(
    await readFile(join(cwd, "src/components/ui/button.tsx"), "utf8"),
  ).toBe("button")
  const manifest = JSON.parse(
    await readFile(join(cwd, ".yopem-ui.json"), "utf8"),
  )
  expect(Object.keys(manifest.files)).toHaveLength(3)
  expect(await installItem("button", { cwd, ...api })).toEqual({
    installed: 0,
    skipped: 3,
  })
})

test("update replaces tracked files, add leaves tracked originals untouched", async () => {
  const cwd = await project()
  const items = fixture()
  const api = services(items)
  await installItem("button", { cwd, ...api })
  items.set("button", item("button", "new button", ["base", "spinner"]))
  expect(await installItem("button", { cwd, ...api })).toEqual({
    installed: 0,
    skipped: 3,
  })
  expect(
    await readFile(join(cwd, "src/components/ui/button.tsx"), "utf8"),
  ).toBe("button")
  expect(await installItem("button", { cwd, mode: "update", ...api })).toEqual({
    installed: 1,
    skipped: 2,
  })
  expect(
    await readFile(join(cwd, "src/components/ui/button.tsx"), "utf8"),
  ).toBe("new button")
})

test("modified file blocks all writes and dependency changes until forced", async () => {
  const cwd = await project()
  const items = fixture()
  const api = services(items)
  await installItem("button", { cwd, ...api })
  const path = join(cwd, "src/components/ui/base.tsx")
  await writeFile(path, "custom base")
  items.set("button", item("button", "new button", ["base", "spinner"]))
  const before = api.calls.length
  await expect(
    installItem("button", { cwd, mode: "update", ...api }),
  ).rejects.toThrow("Modified file")
  expect(api.calls).toHaveLength(before)
  expect(
    await readFile(join(cwd, "src/components/ui/button.tsx"), "utf8"),
  ).toBe("button")
  expect(
    await installItem("button", { cwd, mode: "update", force: true, ...api }),
  ).toEqual({ installed: 2, skipped: 1 })
  expect(await readFile(path, "utf8")).toBe("base")
})

test("untracked file conflicts unless identical", async () => {
  const cwd = await project()
  await mkdir(join(cwd, "src/components/ui"), { recursive: true })
  const path = join(cwd, "src/components/ui/button.tsx")
  await writeFile(path, "custom")
  const api = services(new Map([["button", item("button", "button")]]))
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow(
    "Existing file",
  )
  expect(await readFile(path, "utf8")).toBe("custom")
  await writeFile(path, "button")
  expect(await installItem("button", { cwd, ...api })).toEqual({
    installed: 0,
    skipped: 1,
  })
})

test("rejects unsafe paths, invalid integrity, and cycles", async () => {
  const cwd = await project()
  const items = fixture()
  const api = services(items)
  const button = item("button", "button")
  button.files[0]!.target = "@/../escape.tsx"
  items.set("button", button)
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow(
    "Unsafe registry path",
  )
  button.files[0]!.target = "@/components/ui/button.tsx"
  button.files[0]!.integrity = file("button", "other").integrity
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow(
    "Integrity mismatch",
  )
  button.files[0]!.integrity = file("button", "button").integrity
  button.registryDependencies = ["button"]
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow("Cyclic")
  button.registryDependencies = ["../base"]
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow(
    "Invalid registry dependency",
  )
  await expect(installItem("../button", { cwd, ...api })).rejects.toThrow(
    "Invalid item name",
  )
  expect(api.calls).toEqual([])
  expect(await Bun.file(join(cwd, ".yopem-ui.json")).exists()).toBe(false)
})

test("rejects symlink targets and corrupt manifests", async () => {
  const cwd = await project()
  const outside = await project()
  const api = services(new Map([["button", item("button", "button")]]))
  await mkdir(join(cwd, "src/components"), { recursive: true })
  await symlink(outside, join(cwd, "src/components/ui"))
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow(
    "Unsafe existing path",
  )
  expect(api.calls).toEqual([])
  await rm(join(cwd, "src/components/ui"))
  await writeFile(
    join(cwd, ".yopem-ui.json"),
    '{"version":1,"files":{"src/../bad":"sha256-fake"}}',
  )
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow()
})

test("missing remote dependency or failed bun install leaves files untouched", async () => {
  const cwd = await project()
  const items = new Map([["button", item("button", "button", ["missing"])]])
  const api = services(items)
  await expect(installItem("button", { cwd, ...api })).rejects.toThrow(
    "Registry request failed",
  )
  items.set("button", item("button", "button"))
  await expect(
    installItem("button", {
      cwd,
      fetcher: api.fetcher,
      run: () => Promise.reject(new Error("bun failed")),
    }),
  ).rejects.toThrow("bun failed")
  expect(await Bun.file(join(cwd, ".yopem-ui.json")).exists()).toBe(false)
  expect(
    await Bun.file(join(cwd, "src/components/ui/button.tsx")).exists(),
  ).toBe(false)
})
