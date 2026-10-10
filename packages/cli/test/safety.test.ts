import { expect, spyOn, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import * as fs from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"

import { initProject } from "@/init"
import { installItem } from "@/install"

const results = resolve(import.meta.dirname, "../test-results")

function integrity(content: string) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`
}

function registryItem(
  name: string,
  files: Record<string, string>,
  dependencies = ["react"],
  devDependencies: string[] = [],
) {
  return {
    schemaVersion: 1,
    registryVersion: "1.0.0",
    type: "registry:base",
    name,
    title: name,
    description: name,
    categories: [],
    dependencies,
    devDependencies,
    peerDependencies: [],
    registryDependencies: [],
    files: Object.entries(files).map(([path, content]) => ({
      path: `styles/${basename(path)}`,
      target: `@/${path.slice(4)}`,
      type: "registry:style",
      content,
      integrity: integrity(content),
    })),
  }
}

function fixture(framework?: "vite" | "next") {
  const root = mkdtempSync(join(tmpdir(), "yopem-safe-install-"))
  const originals = new Map<string, string>()

  function put(path: string, content: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), content)
    originals.set(path, content)
  }

  function read(path: string) {
    return readFileSync(join(root, path), "utf8")
  }

  function unchanged(paths: string[]) {
    for (const path of paths)
      expect(read(path), path).toBe(originals.get(path)!)
  }

  put(
    "package.json",
    JSON.stringify({
      dependencies: framework ? { [framework]: "*", react: "*" } : {},
      ...(framework === "next" && {
        scripts: { dev: "next dev", build: "next build", lint: "eslint" },
      }),
    }),
  )

  const source = "src/styles/first.ts"
  const second = "src/styles/second.ts"
  const manifest = "ui.json"

  const files = {
    [source]: "export const first = 2\n",
    [second]: "new file\n",
  }

  if (framework) {
    put("tsconfig.json", "{}")

    if (framework === "vite") {
      put("vite.config.ts", "export default { plugins: [] }")
      put("src/main.tsx", 'import React from "react"')
      put(
        "babel.config.cjs",
        'module.exports = { plugins: ["@babel/plugin-transform-react-jsx"] }',
      )
      put(
        "postcss.config.cjs",
        "module.exports = { plugins: { autoprefixer: {} } }",
      )
    } else {
      put(
        "src/app/layout.tsx",
        'import React from "react"\nexport default function Layout(){return <html><body>Hi</body></html>}',
      )
    }
  } else {
    put(source, "export const first = 1\n")
    put(
      manifest,
      `${JSON.stringify({ version: 1, files: { [source]: integrity(read(source)) } }, null, 2)}\n`,
    )
  }

  function fetcher() {
    return Promise.resolve(
      Response.json(
        registryItem(
          "base",
          framework ? { "src/styles/styles.css": "@stylex;\n" } : files,
          ["react"],
          framework ? [] : ["typescript"],
        ),
      ),
    )
  }

  function temporaryFiles() {
    return readdirSync(root, { recursive: true, encoding: "utf8" })
      .filter((path) =>
        path.split(/[\\/]/).some((part) => part.startsWith(".yopem-ui-")),
      )
      .sort()
  }

  function clean() {
    expect(temporaryFiles()).toEqual([])
  }

  function dispose() {
    rmSync(root, { recursive: true, force: true })
  }

  return {
    root,
    put,
    read,
    unchanged,
    fetcher,
    source,
    second,
    manifest,
    files,
    temporaryFiles,
    clean,
    dispose,
  } as const
}

for (const force of [false, true]) {
  test(`late install conflict preflights every file before source writes (force=${force})`, () => {
    const project = fixture()
    const { root, source, second, manifest, fetcher } = project
    let calls = 0

    try {
      expect(
        installItem("base", {
          cwd: root,
          mode: "update",
          force,
          fetcher,
          run() {
            calls++
            writeFileSync(join(root, second), "concurrent edit\n")

            return Promise.resolve()
          },
        }),
      ).rejects.toThrow(second)
      expect(calls).toBeGreaterThan(0)
      project.unchanged([source, manifest])
      expect(project.read(second)).toBe("concurrent edit\n")
      project.clean()
    } finally {
      project.dispose()
    }
  })
}

for (const failure of [1, 2]) {
  test(`dependency command ${failure} failure leaves sources and tracking intact`, () => {
    const project = fixture()
    const { root, source, second, manifest, fetcher } = project
    let calls = 0

    try {
      expect(
        installItem("base", {
          cwd: root,
          mode: "update",
          fetcher,
          run() {
            calls++
            writeFileSync(
              join(root, "package.json"),
              '{"dependencies":{"react":"installed"}}',
            )
            writeFileSync(
              join(root, "bun.lock"),
              "package manager changed this\n",
            )

            if (calls === failure) throw new Error("dependency command failed")

            return Promise.resolve()
          },
        }),
      ).rejects.toThrow(
        /dependency command failed[\s\S]*[Dd]ependencies may have changed/,
      )
      expect(calls).toBe(failure)
      project.unchanged([source, manifest])
      expect(existsSync(join(root, second))).toBe(false)
      expect(project.read("bun.lock")).toBe("package manager changed this\n")
      expect(project.read("package.json")).toContain("installed")
      project.clean()
    } finally {
      project.dispose()
    }
  })
}

test("staging failure cleans partial temporary files before dependencies", () => {
  const project = fixture()
  const writeFile = fs.writeFile
  let staged = 0

  const fault = spyOn(fs, "writeFile").mockImplementation(
    (path, data, options) => {
      if (
        // Only string paths identify staged files in this fault injection.
        // oxlint-disable-next-line quality/no-runtime-typeof
        typeof path === "string" &&
        path.includes(".yopem-ui-") &&
        basename(path) === "after" &&
        ++staged === 2
      ) {
        throw new Error("staging write denied")
      }

      return writeFile(path, data, options)
    },
  )

  let calls = 0

  try {
    expect(
      installItem("base", {
        cwd: project.root,
        mode: "update",
        fetcher: project.fetcher,
        run() {
          calls++

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow("staging write denied")
    expect(calls).toBe(0)
    project.unchanged([project.source, project.manifest])
    expect(existsSync(join(project.root, project.second))).toBe(false)
    project.clean()
  } finally {
    fault.mockRestore()
    project.dispose()
  }
})

test("tracking manifest write failure rolls back replaced and new sources", () => {
  const project = fixture()
  const destination = join(project.root, project.manifest)
  const rename = fs.rename
  const writeFile = fs.writeFile

  const renameFault = spyOn(fs, "rename").mockImplementation((from, to) => {
    if (String(to) === destination) throw new Error("manifest commit denied")

    return rename(from, to)
  })

  const writeFault = spyOn(fs, "writeFile").mockImplementation(
    (path, data, options) => {
      if (path === destination) throw new Error("manifest commit denied")

      return writeFile(path, data, options)
    },
  )

  chmodSync(join(project.root, project.source), 0o751)
  chmodSync(destination, 0o640)

  try {
    expect(
      installItem("base", {
        cwd: project.root,
        mode: "update",
        fetcher: project.fetcher,
        run: () => Promise.resolve(),
      }),
    ).rejects.toThrow(
      /manifest commit denied[\s\S]*[Dd]ependencies may have changed/,
    )
    project.unchanged([project.source, project.manifest])
    expect(existsSync(join(project.root, project.second))).toBe(false)
    expect(statSync(join(project.root, project.source)).mode & 0o777).toBe(
      0o751,
    )
    expect(statSync(destination).mode & 0o777).toBe(0o640)
    project.clean()
  } finally {
    renameFault.mockRestore()
    writeFault.mockRestore()
    project.dispose()
  }
})

test("incomplete rollback retains original backup and names recovery path", async () => {
  const project = fixture()
  const rename = fs.rename

  const fault = spyOn(fs, "rename").mockImplementation((from, to) => {
    if (String(to) === join(project.root, project.manifest)) {
      throw new Error("manifest commit denied")
    }

    if (
      String(to) === join(project.root, project.source) &&
      basename(String(from)) === "before"
    ) {
      throw new Error("source recovery denied")
    }

    return rename(from, to)
  })

  try {
    const error = await installItem("base", {
      cwd: project.root,
      mode: "update",
      fetcher: project.fetcher,
      run: () => Promise.resolve(),
    }).then(
      () => "unexpected success",
      (cause: unknown) =>
        cause instanceof Error ? cause.message : String(cause),
    )

    expect(error).toContain("Rollback incomplete")
    expect(error).toContain("source recovery denied")

    const backups = project
      .temporaryFiles()
      .filter((path) => basename(path) === "before")

    expect(backups).toHaveLength(1)
    const backup = backups[0]
    expect(project.read(backup)).toBe("export const first = 1\n")
    expect(error).toContain(join(project.root, backup))
    expect(project.read(project.source)).toBe(project.files[project.source])
    project.unchanged([project.manifest])
    expect(existsSync(join(project.root, project.second))).toBe(false)
    mkdirSync(results, { recursive: true })
    writeFileSync(
      join(results, "step2-recovery.log"),
      `${error}\nBackup contents:\n${project.read(backup)}`,
    )
  } finally {
    fault.mockRestore()
    project.dispose()
  }
})

test("add preserves skipped modified source bytes without UTF-8 normalization", async () => {
  const project = fixture()
  const original = Buffer.from([0x2f, 0x2f, 0x20, 0xff, 0x0a])
  writeFileSync(join(project.root, project.source), original)

  try {
    const result = await installItem("base", {
      cwd: project.root,
      fetcher: project.fetcher,
      run: () => Promise.resolve(),
    })

    expect(result).toEqual({ installed: 1, skipped: 1 })
    expect(readFileSync(join(project.root, project.source))).toEqual(original)
    expect(project.read(project.second)).toBe(project.files[project.second])
    project.clean()
  } finally {
    project.dispose()
  }
})

test("successful update uses atomic replacement and preserves modes", async () => {
  const project = fixture()
  const source = join(project.root, project.source)
  const manifest = join(project.root, project.manifest)
  chmodSync(source, 0o751)
  chmodSync(manifest, 0o640)
  const inode = statSync(source).ino

  try {
    await installItem("base", {
      cwd: project.root,
      mode: "update",
      fetcher: project.fetcher,
      run: () => Promise.resolve(),
    })
    expect(project.read(project.source)).toBe(project.files[project.source])
    expect(project.read(project.second)).toBe(project.files[project.second])
    expect(statSync(source).ino).not.toBe(inode)
    expect(statSync(source).mode & 0o777).toBe(0o751)
    expect(statSync(manifest).mode & 0o777).toBe(0o640)
    expect(project.read(project.manifest)).toContain(
      integrity(project.read(project.source)),
    )
    project.clean()
  } finally {
    project.dispose()
  }
})

for (const path of ["src/styles/second.ts", "ui.json"]) {
  test(`install rejects symlink introduced during dependencies at ${path}`, () => {
    const project = fixture()
    project.put("outside.txt", "outside original\n")

    try {
      expect(
        installItem("base", {
          cwd: project.root,
          mode: "update",
          force: true,
          fetcher: project.fetcher,
          run() {
            rmSync(join(project.root, path), { force: true })
            symlinkSync(
              join(project.root, "outside.txt"),
              join(project.root, path),
            )

            return Promise.resolve()
          },
        }),
      ).rejects.toThrow("Unsafe existing path")
      project.unchanged([project.source, "outside.txt"])
      project.clean()
    } finally {
      project.dispose()
    }
  })
}

test("unsafe late directory fails before dependencies or earlier source writes", () => {
  const project = fixture()
  mkdirSync(join(project.root, project.second))
  let calls = 0

  try {
    expect(
      installItem("base", {
        cwd: project.root,
        mode: "update",
        fetcher: project.fetcher,
        run() {
          calls++

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow("Not a regular file")
    expect(calls).toBe(0)
    project.unchanged([project.source, project.manifest])
    project.clean()
  } finally {
    project.dispose()
  }
})

test("concurrent tracking manifest edit is preserved without source writes", () => {
  const project = fixture()
  const current = '{"version":1,"files":{}}\n'

  try {
    expect(
      installItem("base", {
        cwd: project.root,
        mode: "update",
        fetcher: project.fetcher,
        run() {
          writeFileSync(join(project.root, project.manifest), current)

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow(project.manifest)
    project.unchanged([project.source])
    expect(project.read(project.manifest)).toBe(current)
    expect(existsSync(join(project.root, project.second))).toBe(false)
    project.clean()
  } finally {
    project.dispose()
  }
})

test("install refuses symlinked parent before staging or dependencies", () => {
  const project = fixture()
  const path = "src/linked/late.ts"
  project.put("outside/late.ts", "outside original\n")
  symlinkSync(join(project.root, "outside"), join(project.root, "src/linked"))
  let calls = 0

  try {
    expect(
      installItem("base", {
        cwd: project.root,
        force: true,
        fetcher: () =>
          Promise.resolve(
            Response.json(
              registryItem("base", {
                ...project.files,
                [path]: "replacement\n",
              }),
            ),
          ),
        run() {
          calls++

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow("Unsafe existing path")
    expect(calls).toBe(0)
    project.unchanged([project.source, project.manifest, "outside/late.ts"])
    project.clean()
  } finally {
    project.dispose()
  }
})

for (const conflict of [false, true]) {
  test(`shared UI exports handle later package-manager edits safely (conflict=${conflict})`, async () => {
    const project = fixture("vite")
    project.put(
      "package.json",
      JSON.stringify({
        name: "app",
        workspaces: ["packages/*"],
        dependencies: { vite: "*", react: "*" },
      }),
    )
    project.put(
      "packages/ui/package.json",
      JSON.stringify({ name: "@acme/ui", private: true, sideEffects: false }),
    )
    let calls = 0

    try {
      const operation = initProject({
        cwd: project.root,
        ui: "packages/ui",
        fetcher: project.fetcher,
        run() {
          const ui = JSON.parse(project.read("packages/ui/package.json"))
          ui.dependencies = { react: `installed-${++calls}` }

          if (conflict && calls === 3) ui.exports = { "./other": "./other.ts" }
          writeFileSync(
            join(project.root, "packages/ui/package.json"),
            JSON.stringify(ui),
          )

          return Promise.resolve()
        },
      })

      if (conflict) {
        expect(operation).rejects.toThrow(
          /UI package exports changed during installation[\s\S]*base install may have changed/,
        )
        project.unchanged(viteFiles)
        expect(project.read("packages/ui/package.json")).toContain('"./other"')
        expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
      } else {
        await operation
        const ui = JSON.parse(project.read("packages/ui/package.json"))
        expect(ui.dependencies.react).toBe(`installed-${calls}`)
        expect(ui.exports["./components/ui/*"]).toBe(
          "./src/components/ui/*.tsx",
        )
        expect(ui.sideEffects).toEqual(["**/*.css"])
      }

      expect(calls).toBe(3)
      project.clean()
    } finally {
      project.dispose()
    }
  })
}

const viteFiles = [
  "tsconfig.json",
  "vite.config.ts",
  "src/main.tsx",
  "babel.config.cjs",
  "postcss.config.cjs",
]

for (const framework of ["vite", "next"] as const) {
  test(`init ${framework} dependency failure preserves config and reports prior base install`, () => {
    const project = fixture(framework)
    let calls = 0

    try {
      expect(
        initProject({
          cwd: project.root,
          fetcher: project.fetcher,
          run() {
            calls++

            if (calls === 1) throw new Error("init dependency failed")

            return Promise.resolve()
          },
        }),
      ).rejects.toThrow(
        /init dependency failed[\s\S]*[Dd]ependencies may have changed[\s\S]*base install may have changed/,
      )
      project.unchanged(
        framework === "vite"
          ? [...viteFiles, "package.json"]
          : ["tsconfig.json", "src/app/layout.tsx", "package.json"],
      )
      expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
      expect(project.read("src/styles/styles.css")).toBe("@stylex;\n")
      expect(project.read(project.manifest)).toContain(integrity("@stylex;\n"))
      project.clean()
    } finally {
      project.dispose()
    }
  })
}

for (const path of ["src/main.tsx", "postcss.config.cjs"]) {
  test(`init preflights late edit at ${path} without earlier config writes`, () => {
    const project = fixture("vite")
    let calls = 0

    try {
      expect(
        initProject({
          cwd: project.root,
          fetcher: project.fetcher,
          run() {
            if (++calls === 1)
              writeFileSync(join(project.root, path), "concurrent edit\n")

            return Promise.resolve()
          },
        }),
      ).rejects.toThrow(/base install may have changed/)
      project.unchanged(viteFiles.filter((file) => file !== path))
      expect(project.read(path)).toBe("concurrent edit\n")
      expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
      project.clean()
    } finally {
      project.dispose()
    }
  })
}

test("init retirement failure restores Babel, config sources, modes and removes staged files", () => {
  const project = fixture("vite")
  const unlink = fs.unlink

  const fault = spyOn(fs, "unlink").mockImplementation((path) => {
    if (String(path) === join(project.root, "postcss.config.cjs")) {
      throw new Error("PostCSS retirement denied")
    }

    return unlink(path)
  })

  chmodSync(join(project.root, "babel.config.cjs"), 0o751)
  chmodSync(join(project.root, "tsconfig.json"), 0o640)

  try {
    expect(
      initProject({
        cwd: project.root,
        fetcher: project.fetcher,
        run: () => Promise.resolve(),
      }),
    ).rejects.toThrow(
      /PostCSS retirement denied[\s\S]*base install may have changed/,
    )
    project.unchanged(viteFiles)
    expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
    expect(statSync(join(project.root, "babel.config.cjs")).mode & 0o777).toBe(
      0o751,
    )
    expect(statSync(join(project.root, "tsconfig.json")).mode & 0o777).toBe(
      0o640,
    )
    expect(project.read("src/styles/styles.css")).toBe("@stylex;\n")
    project.clean()
  } finally {
    fault.mockRestore()
    project.dispose()
  }
})

test("init rechecks retired symlink after dependencies without following it", () => {
  const project = fixture("vite")
  project.put("outside.txt", "outside original\n")
  let calls = 0

  try {
    expect(
      initProject({
        cwd: project.root,
        fetcher: project.fetcher,
        run() {
          if (++calls === 1) {
            rmSync(join(project.root, "postcss.config.cjs"))
            symlinkSync(
              join(project.root, "outside.txt"),
              join(project.root, "postcss.config.cjs"),
            )
          }

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow("Unsafe existing path")
    project.unchanged([
      ...viteFiles.filter((path) => path !== "postcss.config.cjs"),
      "outside.txt",
    ])
    expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
    project.clean()
  } finally {
    project.dispose()
  }
})

test("Next scripts conflict is detected before any config commits", () => {
  const project = fixture("next")
  let calls = 0

  try {
    expect(
      initProject({
        cwd: project.root,
        fetcher: project.fetcher,
        run() {
          if (++calls === 1) {
            const value = JSON.parse(project.read("package.json"))
            value.scripts.build = "next build --debug"
            writeFileSync(
              join(project.root, "package.json"),
              JSON.stringify(value),
            )
          }

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow(
      /Next.js scripts changed during init[\s\S]*base install may have changed/,
    )
    project.unchanged(["tsconfig.json", "src/app/layout.tsx"])
    expect(project.read("package.json")).toContain("next build --debug")
    expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
    expect(existsSync(join(project.root, "babel.config.js"))).toBe(false)
    project.clean()
  } finally {
    project.dispose()
  }
})

test("Next package write failure rolls back config but keeps package manager edits", () => {
  const project = fixture("next")
  const destination = join(project.root, "package.json")
  const rename = fs.rename
  const writeFile = fs.writeFile

  const renameFault = spyOn(fs, "rename").mockImplementation((from, to) => {
    if (String(to) === destination)
      throw new Error("Next scripts commit denied")

    return rename(from, to)
  })

  const writeFault = spyOn(fs, "writeFile").mockImplementation(
    (path, data, options) => {
      if (path === destination) throw new Error("Next scripts commit denied")

      return writeFile(path, data, options)
    },
  )

  chmodSync(destination, 0o640)
  let latest = ""

  try {
    expect(
      initProject({
        cwd: project.root,
        fetcher: project.fetcher,
        run() {
          const value = JSON.parse(project.read("package.json"))
          value.dependencies.react = "installed"
          latest = JSON.stringify(value)
          writeFileSync(destination, latest)

          return Promise.resolve()
        },
      }),
    ).rejects.toThrow(
      /Next scripts commit denied[\s\S]*base install may have changed/,
    )
    project.unchanged(["tsconfig.json", "src/app/layout.tsx"])
    expect(project.read("package.json")).toBe(latest)
    expect(statSync(destination).mode & 0o777).toBe(0o640)
    expect(existsSync(join(project.root, ".oxlintrc.json"))).toBe(false)
    expect(existsSync(join(project.root, "babel.config.js"))).toBe(false)
    expect(existsSync(join(project.root, "postcss.config.cjs"))).toBe(false)
    project.clean()
  } finally {
    renameFault.mockRestore()
    writeFault.mockRestore()
    project.dispose()
  }
})
