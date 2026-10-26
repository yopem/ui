import { transformSync } from "@babel/core"
import { readFileSync } from "node:fs"
import { resolve, sep } from "node:path"

const sourceRootValue = process.env.YOPEM_EDITOR_STYLEX_SOURCE_ROOT

const importPrefix = process.env.YOPEM_EDITOR_STYLEX_IMPORT_PREFIX

if (!sourceRootValue || !importPrefix)
  throw new Error("Missing consumer StyleX compiler configuration")

const sourceRoot = resolve(sourceRootValue)

const babelRoot = resolve(import.meta.dirname, "../..")

const sourceRootPattern = `${sourceRoot}${sep}`.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&",
)

const sourceFilter = new RegExp(`^${sourceRootPattern}.*\\.tsx?$`)

const aliases =
  importPrefix === "@"
    ? { "@/*": [`${sourceRoot}/*`] }
    : {
        "@/*": [`${sourceRoot}/*`],
        [`${importPrefix}/*`]: [`${sourceRoot}/*`],
      }

Bun.plugin({
  name: "consumer-stylex-compiler",
  setup(build) {
    build.onLoad({ filter: sourceFilter }, ({ path }) => {
      const transformed = transformSync(readFileSync(path, "utf8"), {
        filename: path,
        cwd: babelRoot,
        configFile: false,
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: [
          [
            "@stylexjs/babel-plugin",
            {
              aliases,
              dev: false,
              runtimeInjection: false,
              treeshakeCompensation: true,
              unstable_moduleResolution: { type: "commonJS" },
            },
          ],
        ],
      })

      if (!transformed?.code) throw new Error(`Could not transform ${path}`)

      if (path.endsWith(`${sep}tokens.stylex.ts`))
        console.info(`StyleX fixture compiler transformed ${path}`)

      return {
        contents: transformed.code,
        loader: path.endsWith(".tsx") ? "tsx" : "ts",
      }
    })
  },
})
