import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, test } from "node:test"

import { configureFramework } from "#adapters"

const temporary: string[] = []
function project(files: Record<string, string>) {
  const root = join(tmpdir(), `yopem-adapter-${randomUUID()}`)
  mkdirSync(root)
  temporary.push(root)
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return root
}

afterEach(() => {
  for (const path of temporary.splice(0)) {
    rmSync(path, { force: true, recursive: true })
  }
})

test("configures a standard Vite entry", async () => {
  const root = project({
    "src/main.tsx": "createRoot(root).render(<App />)\n",
    "vite.config.ts":
      'import react from "@vitejs/plugin-react"\nexport default { plugins: [react()] }\n',
  })
  await configureFramework(root, "vite", false)
  assert.match(
    readFileSync(join(root, "vite.config.ts"), "utf8"),
    /stylex\.vite/,
  )
  assert.match(
    readFileSync(join(root, "src/main.tsx"), "utf8"),
    /ThemeProvider/,
  )
})

test("configures a standard Next App layout", async () => {
  const root = project({
    "app/layout.tsx":
      'export default function Layout({ children }) { return <html lang="en"><body>{children}</body></html> }\n',
  })
  await configureFramework(root, "next-app", false)
  assert.match(readFileSync(join(root, "babel.config.js"), "utf8"), /stylexjs/)
  assert.match(
    readFileSync(join(root, "postcss.config.js"), "utf8"),
    /@stylexjs\/postcss-plugin/,
  )
  assert.match(
    readFileSync(join(root, "app/layout.tsx"), "utf8"),
    /ThemeScript/,
  )
})

test("configures a standard TanStack Start root", async () => {
  const root = project({
    "src/routes/__root.tsx":
      'export const Route = createRootRoute({ shellComponent: Root })\nfunction Root({ children }) { return <html lang="en"><head><HeadContent /></head><body>{children}</body></html> }\n',
    "vite.config.ts":
      "export default { plugins: [tanstackStart(), react()] }\n",
  })
  await configureFramework(root, "tanstack-start", false)
  assert.match(
    readFileSync(join(root, "vite.config.ts"), "utf8"),
    /stylex\.vite/,
  )
  const route = readFileSync(join(root, "src/routes/__root.tsx"), "utf8")
  assert.match(route, /getRootThemeProps/)
  assert.match(route, /ThemeProvider/)
})
