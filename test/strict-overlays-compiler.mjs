// Run StyleX's compiler in Node, matching Vite. Repeated transforms under Bun
// can fail in the compiler's media-query parser after several modules.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"

const root = resolve(import.meta.dirname, "..")

const registryRequire = createRequire(
  resolve(root, "packages/registry/package.json"),
)

const docsRequire = createRequire(resolve(root, "apps/docs/package.json"))

const { transformSync } = docsRequire("@babel/core")

const plugin = docsRequire("@stylexjs/babel-plugin")

const stylex = registryRequire("@stylexjs/stylex")

const ts = registryRequire("typescript-api")

const fixtures = {}

for (const name of process.argv.slice(2)) {
  const filename = resolve(
    root,
    "packages/registry/src/components/ui",
    `${name}.tsx`,
  )

  const source = readFileSync(filename, "utf8")

  const end =
    source.indexOf("\n})", source.indexOf("const styles = stylex.create(")) + 3

  const result = transformSync(
    `${source.slice(0, end)}\nexport const fixtureStyles = styles;
export const fixtureOverrides = stylex.create({ test: { paddingBlockEnd: "3rem", paddingInlineEnd: "3rem", pointerEvents: "auto", backgroundColor: "rgb(255, 0, 0)" } });`.replaceAll(
      "@registry/styles/",
      `${root}/packages/registry/src/styles/`,
    ),
    {
      filename,
      parserOpts: { plugins: ["typescript", "jsx"] },
      plugins: [
        [
          plugin,
          {
            dev: false,
            unstable_moduleResolution: { type: "commonJS", rootDir: root },
          },
        ],
      ],
    },
  )

  const code = ts.transpileModule(result.code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

  const styles = runInNewContext(
    `${code.replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "").replace(/export /g, "")}\n({ ...fixtureStyles, override: fixtureOverrides.test })`,
    {
      stylex,
      createContext: () => ({}),
      React: { createContext: () => ({}) },
    },
  )

  fixtures[name] = {
    styles,
    css: result.metadata.stylex
      .toSorted((a, b) => a[2] - b[2])
      .map(([, rule]) => rule.ltr)
      .join("\n"),
  }
}

process.stdout.write(JSON.stringify(fixtures))
