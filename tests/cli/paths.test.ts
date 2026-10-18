import { installItem, planInstall, resolveInitPaths } from "@cli/install"
import { afterAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"

import { snapshot } from "./files"

const evidence: object[] = []

const results = resolve(import.meta.dirname, "../../test-results/cli")

function integrity(content: string) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "yopem-paths-"))
  const calls: string[][] = []

  const files = new Map([
    [
      "@/components/ui/nested/button.tsx",
      'import "@/styles/styles.css"\nexport { helper } from "@/lib/helper.js"\nexport { useThing } from \'@/hooks/use-thing\'\nexport { theme } from "@/theme/theme"\nexport { other } from "@/components/other"\nexport { button } from "@/components/ui/nested/button"\nimport "@/library/untouched"\n',
    ],
    ["@/components/other.ts", "export const other = 1\n"],
    ["@/hooks/use-thing.ts", "export const useThing = 1\n"],
    ["@/lib/helper.ts", "export const helper = 1\n"],
    ["@/styles/styles.css", '@import "@/styles/reset.css";\n'],
    ["@/theme/theme.ts", "export const theme = 1\n"],
  ])

  function put(path: string, content: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), content)
  }

  function read(path: string) {
    return readFileSync(join(root, path), "utf8")
  }

  put("package.json", '{"name":"paths-app"}\n')

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      return Response.json({
        schemaVersion: 1,
        registryVersion: "1.0.0",
        name: basename(new URL(request.url).pathname, ".json"),
        title: "sample",
        description: "sample",
        type: "registry:ui",
        categories: [],
        dependencies: [],
        devDependencies: [],
        peerDependencies: [],
        registryDependencies: [],
        files: [...files].map(([target, content]) => ({
          path: `ui/${basename(target)}`,
          target,
          content,
          integrity: integrity(content),
          type: "registry:ui",
        })),
      })
    },
  })

  const options = {
    cwd: root,
    registryUrl: `${server.url}r`,
    run(args: string[]) {
      calls.push(args)

      return Promise.resolve()
    },
  }

  async function dispose() {
    await server.stop(true)
    rmSync(root, { recursive: true, force: true })
  }

  return { root, files, calls, options, put, read, dispose }
}

const customPaths = {
  components: "src/widgets",
  ui: "design/controls",
  hooks: "source/hooks",
  lib: "source/lib",
  styles: "assets/styles",
  theme: "source/theme",
}

test("custom paths rewrite all imports, retain suffixes, track hashes, and update", async () => {
  const project = fixture()

  try {
    project.put(
      "ui.json",
      JSON.stringify({
        version: 1,
        files: {},
        paths: customPaths,
        importPrefix: "@acme/design",
      }),
    )
    const result = await installItem("sample", project.options)
    expect(result.installed).toBe(6)
    const content = project.read("design/controls/nested/button.tsx")

    for (const specifier of [
      "@acme/design/assets/styles/styles.css",
      "@acme/design/source/lib/helper.js",
      "@acme/design/source/hooks/use-thing",
      "@acme/design/source/theme/theme",
      "@acme/design/widgets/other",
      "@acme/design/design/controls/nested/button",
      "@acme/design/library/untouched",
    ])
      expect(content).toContain(specifier)
    expect(project.read("assets/styles/styles.css")).toContain(
      '@import "@acme/design/assets/styles/reset.css"',
    )
    const manifest = JSON.parse(project.read("ui.json"))
    expect(manifest.paths).toEqual(customPaths)
    expect(manifest.files["design/controls/nested/button.tsx"]).toBe(
      integrity(content),
    )
    expect(
      manifest.provenance["design/controls/nested/button.tsx"],
    ).toMatchObject({
      registryUrl: project.options.registryUrl,
      items: { sample: "1.0.0" },
    })
    project.files.set("@/lib/helper.ts", "export const helper = 2\n")
    await installItem("sample", { ...project.options, mode: "update" })
    expect(project.read("source/lib/helper.ts")).toBe(
      "export const helper = 2\n",
    )
    evidence.push({
      name: "custom-update",
      result,
      files: snapshot(project.root),
    })
  } finally {
    await project.dispose()
  }
})

test("missing paths retain defaults; partial paths do not change other roots", async () => {
  const project = fixture()

  try {
    await installItem("sample", project.options)
    expect(project.read("src/components/ui/nested/button.tsx")).toBe(
      project.files.get("@/components/ui/nested/button.tsx")!,
    )
    expect(JSON.parse(project.read("ui.json")).paths).toBeUndefined()
    const fresh = fixture()

    try {
      fresh.put(
        "ui.json",
        JSON.stringify({
          version: 1,
          files: {},
          paths: { components: "widgets" },
        }),
      )
      await installItem("sample", fresh.options)
      expect(fresh.read("widgets/other.ts")).toBe(
        fresh.files.get("@/components/other.ts")!,
      )
      expect(fresh.read("src/components/ui/nested/button.tsx")).toContain(
        "@/../widgets/other",
      )
    } finally {
      await fresh.dispose()
    }
  } finally {
    await project.dispose()
  }
})

test("custom dry run leaves project unchanged and previews mapped destinations", async () => {
  const project = fixture()

  try {
    project.put(
      "ui.json",
      JSON.stringify({ version: 1, files: {}, paths: customPaths }),
    )
    const before = snapshot(project.root)

    const result = await installItem("sample", {
      ...project.options,
      dryRun: true,
    })

    expect(snapshot(project.root)).toEqual(before)
    expect(project.calls).toEqual([])
    expect(result.preview?.files).toContainEqual({
      path: "design/controls/nested/button.tsx",
      action: "write",
    })
    evidence.push({
      name: "dry-run",
      result,
      before,
      after: snapshot(project.root),
    })
  } finally {
    await project.dispose()
  }
})

for (const paths of [
  null,
  [],
  "src/ui",
  { unknown: "src/ui" },
  { ui: 1 },
  ...[
    "",
    "/tmp/ui",
    "../ui",
    "src/../ui",
    "src//ui",
    "src/./ui",
    "C:/ui",
    "src\\ui",
    "src/ui/",
  ].map((ui) => ({ ui })),
]) {
  test(`reject invalid paths ${JSON.stringify(paths)} without writes`, async () => {
    const project = fixture()

    try {
      project.put("ui.json", JSON.stringify({ version: 1, files: {}, paths }))
      const before = snapshot(project.root)
      expect(installItem("sample", project.options)).rejects.toThrow()
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

test("overlapping directories allow distinct destination files", async () => {
  const project = fixture()

  try {
    project.put(
      "ui.json",
      JSON.stringify({
        version: 1,
        files: {},
        paths: { ui: "src/components", lib: "src/styles/lib" },
      }),
    )
    await installItem("sample", project.options)
    const content = project.read("src/components/nested/button.tsx")

    expect(content).toContain("@/components/nested/button")
    expect(content).toContain("@/styles/lib/helper.js")
    expect(project.read("src/styles/lib/helper.ts")).toBe(
      project.files.get("@/lib/helper.ts")!,
    )
    expect(project.read("src/components/other.ts")).toBe(
      project.files.get("@/components/other.ts")!,
    )
  } finally {
    await project.dispose()
  }
})

test("reject destination collisions even when contents match", async () => {
  const project = fixture()

  try {
    project.files.clear()
    project.files.set("@/components/ui/button.ts", "same")
    project.files.set("@/components/controls/button.ts", "same")
    project.put(
      "ui.json",
      JSON.stringify({
        version: 1,
        files: {},
        paths: { components: "src/widgets", ui: "src/widgets/controls" },
      }),
    )
    const before = snapshot(project.root)
    expect(installItem("sample", project.options)).rejects.toThrow(/collision/i)
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

test("reject symlink directories outside src", async () => {
  const project = fixture()
  const outside = mkdtempSync(join(tmpdir(), "yopem-paths-outside-"))

  try {
    project.put(
      "ui.json",
      JSON.stringify({ version: 1, files: {}, paths: customPaths }),
    )
    symlinkSync(outside, join(project.root, "design"))
    const before = snapshot(project.root)
    expect(installItem("sample", project.options)).rejects.toThrow(
      "Unsafe existing path",
    )
    expect(snapshot(project.root)).toEqual(before)
    expect(snapshot(outside)).toHaveLength(1)
  } finally {
    await project.dispose()
    rmSync(outside, { recursive: true, force: true })
  }
})

test("reject changed tracked destinations when adding a different item", async () => {
  const project = fixture()

  try {
    await installItem("sample", project.options)
    const manifest = JSON.parse(project.read("ui.json"))

    manifest.paths = { ui: "design/widgets" }
    project.put("ui.json", JSON.stringify(manifest))
    project.files.clear()
    project.files.set("@/hooks/other.ts", "export const other = 1\n")
    const before = snapshot(project.root)

    expect(installItem("other", project.options)).rejects.toThrow(/tracked/i)
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

for (const legacy of [false, true]) {
  test(`reject remapping tracked copies (legacy=${legacy})`, async () => {
    const project = fixture()

    try {
      if (!legacy)
        project.put(
          "ui.json",
          JSON.stringify({ version: 1, files: {}, paths: customPaths }),
        )
      await installItem("sample", project.options)
      const manifest = JSON.parse(project.read("ui.json"))

      if (legacy) delete manifest.provenance
      manifest.paths = { ...manifest.paths, lib: "new/lib" }
      project.put("ui.json", JSON.stringify(manifest))
      const before = snapshot(project.root)
      expect(
        installItem("sample", {
          ...project.options,
          mode: "update",
          force: true,
        }),
      ).rejects.toThrow(/tracked/i)
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

test("packed CLI installs and previews custom directories", async () => {
  const project = fixture()
  const packed = mkdtempSync(join(tmpdir(), "yopem-paths-pack-"))
  const repository = resolve(import.meta.dirname, "../..")
  const output: object[] = []

  async function command(args: string[], cwd: string) {
    const process = Bun.spawn(args, { cwd, stdout: "pipe", stderr: "pipe" })

    const [stdout, stderr, code] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited,
    ])

    output.push({ args, stdout, stderr, code })
    expect(code, `${args.join(" ")}\n${stdout}${stderr}`).toBe(0)

    return stdout
  }

  try {
    await command(
      ["bun", "pm", "pack", "--filename", join(packed, "cli.tgz")],
      join(repository, "packages/cli"),
    )
    await command(
      ["tar", "-xzf", join(packed, "cli.tgz"), "-C", packed],
      packed,
    )
    symlinkSync(
      join(repository, "packages/cli/node_modules"),
      join(packed, "package/node_modules"),
    )
    project.put(
      "ui.json",
      JSON.stringify({ version: 1, files: {}, paths: customPaths }),
    )

    const args = [
      "node",
      join(packed, "package/dist/cli.js"),
      "add",
      "sample",
      "--registry",
      project.options.registryUrl,
    ]

    const before = snapshot(project.root)
    await command([...args, "--dry-run"], project.root)
    expect(snapshot(project.root)).toEqual(before)
    await command(args, project.root)
    expect(project.read("design/controls/nested/button.tsx")).toContain(
      '"@/../assets/styles/styles.css"',
    )
    expect(project.read("assets/styles/styles.css")).toContain(
      '"@/../assets/styles/reset.css"',
    )
    evidence.push({ name: "packed-cli", output, files: snapshot(project.root) })
  } finally {
    await project.dispose()
    rmSync(packed, { recursive: true, force: true })
  }
}, 120_000)

for (const src of [false, true]) {
  test(`init detects defaults without writes (src=${src})`, async () => {
    const project = fixture()

    try {
      if (src) mkdirSync(join(project.root, "src"))
      const before = snapshot(project.root)
      const prefix = src ? "src/" : ""

      const paths = {
        components: `${prefix}components`,
        ui: `${prefix}components/ui`,
        hooks: `${prefix}hooks`,
        lib: `${prefix}lib`,
        styles: `${prefix}styles`,
        theme: `${prefix}themes`,
      }

      expect(await resolveInitPaths(project.root)).toEqual({
        paths,
        importPrefix: "@",
        sourceRoot: src ? "src" : ".",
      })
      expect(snapshot(project.root)).toEqual(before)
      project.put(
        "ui.json",
        JSON.stringify({
          version: 1,
          files: {},
          paths: { hooks: "custom/hooks" },
        }),
      )
      expect(
        await resolveInitPaths(project.root, "@acme/ui", { lib: "shared/lib" }),
      ).toEqual({
        paths: { ...paths, hooks: "custom/hooks", lib: "shared/lib" },
        importPrefix: "@acme/ui",
        sourceRoot: src ? "src" : ".",
      })
      project.put(
        "ui.json",
        JSON.stringify({
          version: 1,
          files: {},
          paths: customPaths,
          importPrefix: "@acme/design",
        }),
      )

      expect(await resolveInitPaths(project.root)).toEqual({
        paths: customPaths,
        importPrefix: "@acme/design",
        sourceRoot: src ? "src" : ".",
      })
    } finally {
      await project.dispose()
    }
  })
}

test("explicit path options merge, plan persistence, and dry run without writes", async () => {
  const project = fixture()

  try {
    project.put(
      "ui.json",
      JSON.stringify({
        version: 1,
        files: {},
        paths: { hooks: "existing/hooks" },
      }),
    )

    const options = {
      ...project.options,
      paths: { ui: "controls", theme: "themes" },
    }

    const before = snapshot(project.root)
    const plan = await planInstall("sample", options)
    expect(plan.paths.hooks).toBe("existing/hooks")
    expect(JSON.parse(plan.changes.get("ui.json")!.after!).paths).toEqual({
      hooks: "existing/hooks",
      ui: "controls",
      theme: "themes",
    })
    expect(snapshot(project.root)).toEqual(before)
    const preview = await installItem("sample", { ...options, dryRun: true })
    expect(preview.preview?.files).toContainEqual({
      path: "controls/nested/button.tsx",
      action: "write",
    })
    expect(snapshot(project.root)).toEqual(before)
    await installItem("sample", options)
    expect(JSON.parse(project.read("ui.json")).paths).toEqual({
      hooks: "existing/hooks",
      ui: "controls",
      theme: "themes",
    })
    expect(project.read("themes/theme.ts")).toBe("export const theme = 1\n")
    evidence.push({
      name: "explicit-options",
      preview,
      files: snapshot(project.root),
    })
  } finally {
    await project.dispose()
  }
})

for (const paths of [
  { ui: "../escape" },
  { ui: "/tmp/ui" },
  { ui: "" },
  { ui: "safe", unknown: "extra" },
]) {
  test(`reject invalid explicit overrides ${JSON.stringify(paths)} before writes`, async () => {
    const project = fixture()

    try {
      const before = snapshot(project.root)
      expect(resolveInitPaths(project.root, undefined, paths)).rejects.toThrow()
      expect(
        installItem("sample", { ...project.options, paths }),
      ).rejects.toThrow()
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
    } finally {
      await project.dispose()
    }
  })
}

for (const legacy of [false, true]) {
  test(`init preserves tracked legacy roots and rejects remapping (legacy=${legacy})`, async () => {
    const project = fixture()

    try {
      await installItem("sample", project.options)
      const manifest = JSON.parse(project.read("ui.json"))

      if (legacy) delete manifest.provenance
      manifest.paths = { hooks: "src/hooks" }
      project.put("ui.json", JSON.stringify(manifest))
      const resolved = await resolveInitPaths(project.root)
      expect(resolved.sourceRoot).toBe("src")
      expect(resolved.paths).toEqual({
        components: "src/components",
        ui: "src/components/ui",
        hooks: "src/hooks",
        lib: "src/lib",
        styles: "src/styles",
        theme: "src/theme",
      })
      await installItem("sample", { ...project.options, paths: resolved.paths })
      const before = snapshot(project.root)
      project.files.clear()
      project.files.set("@/hooks/other.ts", "export const other = 1\n")
      expect(
        installItem("other", {
          ...project.options,
          paths: { theme: "src/themes" },
          force: true,
        }),
      ).rejects.toThrow(/tracked/i)
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

test("no-src init installs root imports without parent traversal and persists sourceRoot", async () => {
  const project = fixture()

  try {
    const resolved = await resolveInitPaths(project.root)
    const before = snapshot(project.root)
    const options = { ...project.options, ...resolved }
    await installItem("sample", { ...options, dryRun: true })
    expect(snapshot(project.root)).toEqual(before)
    await installItem("sample", options)
    const content = project.read("components/ui/nested/button.tsx")
    expect(content).toContain('"@/styles/styles.css"')
    expect(content).toContain('"@/themes/theme"')
    expect(content).not.toContain("@/../")
    expect(JSON.parse(project.read("ui.json")).sourceRoot).toBe(".")
    expect((await resolveInitPaths(project.root)).sourceRoot).toBe(".")
    const beforeChange = snapshot(project.root)
    expect(
      installItem("sample", { ...options, sourceRoot: "src" }),
    ).rejects.toThrow(/source root.*tracked/i)
    expect(snapshot(project.root)).toEqual(beforeChange)
    evidence.push({ name: "no-src-imports", files: snapshot(project.root) })
  } finally {
    await project.dispose()
  }
})

test("no-src installs keep other registry directories under project root", async () => {
  const project = fixture()

  try {
    project.files.set("@/library/untouched.ts", "export const value = 1\n")
    const resolved = await resolveInitPaths(project.root)

    await installItem("sample", { ...project.options, ...resolved })
    expect(project.read("library/untouched.ts")).toBe(
      "export const value = 1\n",
    )
    expect(project.read("components/ui/nested/button.tsx")).toContain(
      'import "@/library/untouched"',
    )
    project.files.set("@/library/untouched.ts", "export const value = 2\n")
    await installItem("sample", { ...project.options, mode: "update" })
    expect(project.read("library/untouched.ts")).toBe(
      "export const value = 2\n",
    )
  } finally {
    await project.dispose()
  }
})

for (const sourceRoot of [null, "other", "../", 1]) {
  test(`reject invalid sourceRoot ${JSON.stringify(sourceRoot)} without writes`, async () => {
    const project = fixture()

    try {
      const options = { ...project.options }
      Reflect.set(options, "sourceRoot", sourceRoot)
      const before = snapshot(project.root)
      expect(installItem("sample", options)).rejects.toThrow(/source root/i)
      expect(snapshot(project.root)).toEqual(before)
      project.put(
        "ui.json",
        JSON.stringify({ version: 1, files: {}, sourceRoot }),
      )
      expect(resolveInitPaths(project.root)).rejects.toThrow(/source root/i)
    } finally {
      await project.dispose()
    }
  })
}

afterAll(() => {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    join(results, "paths.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
})
