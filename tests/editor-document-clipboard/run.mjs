import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const installed = createRequire(
  new URL("../../packages/editor/package.json", import.meta.url),
)

const native = createRequire(installed.resolve("@lexical/rich-text"))

const results = new URL(
  "../../test-results/editor-document-clipboard/",
  import.meta.url,
)

await mkdir(results, { recursive: true })

const build = await Bun.build({
  entrypoints: [fileURLToPath(new URL("./fixture.ts", import.meta.url))],
  target: "browser",
  plugins: [
    {
      name: "document-clipboard-owned-sources",
      setup(builder) {
        builder.onResolve(
          { filter: /^(@editor\/|@yopem-ui\/editor\/)/ },
          ({ path }) => ({
            path: fileURLToPath(
              new URL(
                `../../packages/editor/src/${path.replace(/^(@editor\/|@yopem-ui\/editor\/)/, "")}.ts`,
                import.meta.url,
              ),
            ),
          }),
        )
        builder.onResolve(
          { filter: /^(@lexical\/|lexical$|zod$)/ },
          ({ path }) => {
            let resolved

            try {
              resolved = installed.resolve(path)
            } catch {
              resolved = native.resolve(path)
            }

            return { path: resolved }
          },
        )
      },
    },
  ],
})

assert.equal(
  build.success,
  true,
  build.logs.map((entry) => entry.message).join("\n"),
)

const script = await build.outputs[0].text()

await writeFile(new URL("fixture.js", results), script)

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    return new URL(request.url).pathname === "/clipboard-fixture.js"
      ? new Response(script, { headers: { "Content-Type": "text/javascript" } })
      : new Response(
          '<!doctype html><html lang="en"><head><title>Document clipboard regression</title></head><body><script type="module" src="/clipboard-fixture.js"></script></body></html>',
          { headers: { "Content-Type": "text/html" } },
        )
  },
})

const statuses = []

try {
  await writeFile(new URL("probe-port.txt", results), String(server.port))

  for (const name of ["native", "safety", "protocol", "cross-schema"]) {
    const child = Bun.spawn(
      [
        process.execPath,
        "--no-install",
        fileURLToPath(new URL(`./${name}.mjs`, import.meta.url)),
      ],
      {
        cwd: fileURLToPath(results),
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0" },
      },
    )

    const [status, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ])

    const output = stdout + stderr

    await writeFile(new URL(`${name}.log`, results), output)
    statuses.push({ name, status })

    if (status !== 0) console.error(output)
  }
} finally {
  await server.stop(true)
}

await writeFile(
  new URL("statuses.json", results),
  JSON.stringify(statuses, null, 2),
)

assert(
  statuses.every((result) => result.status === 0),
  JSON.stringify(statuses),
)

console.info(
  "Document clipboard native, safety, MIME, and schema assertions passed.",
)
