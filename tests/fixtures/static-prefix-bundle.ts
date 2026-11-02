import { transformSync } from "@babel/core"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const output = process.argv[2]

if (!output) throw new Error("Missing fixture bundle output path")

const build = await Bun.build({
  entrypoints: [resolve(import.meta.dirname, "static-prefix-hydrate.tsx")],
  target: "browser",
  format: "iife",
  tsconfig: resolve(root, "tests/tsconfig.json"),
  plugins: [
    {
      name: "stylex-test-transform",
      setup(builder) {
        builder.onLoad({ filter: /\.[jt]sx?$/ }, async ({ path }) => {
          if (
            !path.startsWith(resolve(root, "apps/docs/src/")) &&
            !path.startsWith(resolve(root, "packages/editor/src/")) &&
            !path.startsWith(resolve(root, "packages/registry/src/")) &&
            !path.startsWith(resolve(import.meta.dirname, "."))
          )
            return

          const source = await readFile(path, "utf8")

          const transformed = transformSync(source, {
            filename: path,
            configFile: false,
            babelrc: false,
            parserOpts: { plugins: ["typescript", "jsx"] },
            plugins: [
              [
                "@stylexjs/babel-plugin",
                {
                  aliases: {
                    "@registry/*": [resolve(root, "packages/registry/src/*")],
                  },
                  dev: false,
                  runtimeInjection: false,
                  treeshakeCompensation: true,
                  unstable_moduleResolution: {
                    type: "commonJS",
                    rootDir: root,
                  },
                },
              ],
            ],
          })

          if (!transformed?.code) throw new Error(`Could not transform ${path}`)

          return {
            contents: transformed.code,
            loader: path.endsWith(".tsx") ? "tsx" : "ts",
          }
        })
      },
    },
  ],
})

if (!build.success)
  throw new AggregateError(build.logs, "Fixture bundle failed")

const bundle = build.outputs[0]

if (!bundle) throw new Error("Missing fixture bundle")

await writeFile(output, await bundle.text())
