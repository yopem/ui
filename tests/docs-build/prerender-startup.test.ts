import { expect, test } from "bun:test"
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const repository = fileURLToPath(new URL("../../", import.meta.url))

test("prerenders every route after a slow worker module becomes ready", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "nitro-prerender-startup-"))
  const artifacts = join(repository, "test-results/docs-build-startup")

  const nitroPackage = Bun.resolveSync(
    "nitro/package.json",
    join(repository, "apps/docs"),
  )

  const cli = join(dirname(nitroPackage), "dist/cli/index.mjs")

  try {
    await mkdir(join(fixture, "node_modules"))
    await symlink(
      dirname(nitroPackage),
      join(fixture, "node_modules/nitro"),
      "dir",
    )
    await mkdir(join(fixture, "server/routes"), { recursive: true })
    await writeFile(
      join(fixture, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    )
    await writeFile(
      join(fixture, "delayed-plugin.mjs"),
      "await new Promise((resolve) => setTimeout(resolve, 4000)); export default function install() { return undefined }",
    )
    await writeFile(
      join(fixture, "server/routes/index.mjs"),
      "export default function home() { return new Response('Ready', { headers: { 'content-type': 'text/html' } }) }",
    )
    await writeFile(
      join(fixture, "nitro.config.mjs"),
      "export default { preset: 'static', serverDir: './server', builder: 'rolldown', logLevel: 4, plugins: ['./delayed-plugin.mjs'], prerender: { routes: ['/'], failOnError: true }, hooks: { 'prerender:route'(route) { console.info(JSON.stringify({ startupProbe: true, route: route.route, error: route.error ? { message: route.error.message, status: route.error.statusCode ?? route.error.status } : null })) } } }",
    )

    const child = Bun.spawn(["node", cli, "build", fixture], {
      cwd: fixture,
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=512" },
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120000,
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])

    await mkdir(artifacts, { recursive: true })
    await writeFile(join(artifacts, "build.log"), `${stdout}\n${stderr}`)
    await writeFile(
      join(artifacts, "report.json"),
      JSON.stringify(
        { exitCode, delayedModuleMilliseconds: 4000, log: "build.log" },
        null,
        2,
      ),
    )

    expect(exitCode).toBe(0)
    expect(
      await readFile(join(fixture, ".output/public/index.html"), "utf8"),
    ).toBe("Ready")
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}, 150000)
