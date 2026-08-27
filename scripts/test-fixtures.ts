import { spawn } from "node:child_process"
import { cp, mkdtemp, readFile, rm } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const registryRoot = resolve(root, "packages/registry/dist/r")
const cli = resolve(root, "packages/cli/dist/index.js")
const selected = process.env.FIXTURE
  ? [process.env.FIXTURE]
  : ["vite", "next-app", "next-pages", "tanstack-start", "workspace"]

const mime = new Map([[".json", "application/json"]])
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost")
    const path = resolve(registryRoot, `.${url.pathname}`)
    if (!path.startsWith(registryRoot)) throw new Error("Unsafe path")
    const body = await readFile(path)
    response.writeHead(200, {
      "content-type": mime.get(".json") ?? "application/octet-stream",
    })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end("Not found")
  }
})

await new Promise<void>((done) => server.listen(0, "127.0.0.1", done))
const address = server.address()
if (!address || typeof address === "string") throw new Error("Registry failed")
const registry = `http://127.0.0.1:${address.port}`

async function run(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, YOPEM_REGISTRY_URL: registry },
    stdio: ["ignore", "pipe", "pipe"],
  })
  let output = ""
  child.stdout.on("data", (chunk) => {
    output += String(chunk)
  })
  child.stderr.on("data", (chunk) => {
    output += String(chunk)
  })
  const code = await new Promise<number | null>((done) =>
    child.on("exit", done),
  )
  if (code !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed in ${cwd}\n${output.split("\n").slice(-80).join("\n")}`,
    )
  }
}

try {
  for (const fixture of selected) {
    const temporary = await mkdtemp(join(tmpdir(), `yopem-${fixture}-`))
    try {
      await cp(resolve(root, "fixtures", fixture), temporary, {
        recursive: true,
      })
      const cwd =
        fixture === "workspace" ? join(temporary, "apps/web") : temporary
      console.info(`Verifying ${fixture}`)
      await run("node", [cli, "init", "--yes"], cwd)
      await run("node", [cli, "add", "button", "--yes"], cwd)
      await run("npm", ["run", "build"], cwd)
    } finally {
      await rm(temporary, { force: true, recursive: true })
    }
  }
} finally {
  server.close()
}

console.info(
  `Verified ${selected.length} fixture${selected.length === 1 ? "" : "s"}`,
)
