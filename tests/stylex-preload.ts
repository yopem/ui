import { transformSync } from "@babel/core"
import { readFileSync } from "node:fs"
import { resolve, sep } from "node:path"

const root = resolve(import.meta.dirname, "..")

const sourceRoots = [
  resolve(root, "apps/docs/src"),
  resolve(root, "packages/editor/src"),
  resolve(root, "packages/registry/src"),
]

const sourceFilter = new RegExp(
  `^(?:${sourceRoots
    .map((sourceRoot) =>
      `${sourceRoot}${sep}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("|")}).*\\.tsx?$`,
)

const stylexOptions = {
  aliases: { "@registry/*": [resolve(root, "packages/registry/src/*")] },
  dev: process.env.NODE_ENV !== "production",
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { rootDir: root, type: "commonJS" },
}

Bun.plugin({
  name: "native-stylex-test-preload",
  setup(build) {
    build.onLoad({ filter: sourceFilter }, ({ path }) => {
      const transformed = transformSync(readFileSync(path, "utf8"), {
        filename: path,
        configFile: false,
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: [["@stylexjs/babel-plugin", stylexOptions]],
      })

      if (!transformed?.code) throw new Error(`Could not transform ${path}`)

      return {
        contents: transformed.code,
        loader: path.endsWith(".tsx") ? "tsx" : "ts",
      }
    })
  },
})
