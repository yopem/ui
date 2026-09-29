// Match Vite's Node runtime; repeated transforms can break StyleX's parser in Bun.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")

const docsRequire = createRequire(resolve(root, "apps/docs/package.json"))

const { transformSync } = docsRequire("@babel/core")

const plugin = docsRequire("@stylexjs/babel-plugin")

const { source, filename } = JSON.parse(readFileSync(0, "utf8"))

const result = transformSync(source, {
  filename,
  plugins: [
    [
      plugin,
      {
        dev: false,
        runtimeInjection: false,
        unstable_moduleResolution: { type: "commonJS", rootDir: root },
      },
    ],
  ],
})

process.stdout.write(result.code)
