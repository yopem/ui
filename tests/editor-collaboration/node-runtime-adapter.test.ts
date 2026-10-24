import { expect, test } from "bun:test"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { createInterface } from "node:readline"
import { z } from "zod"

import { nativeWorkflowReportSchema } from "./native-workflow"

const runNative = process.env.RUN_NATIVE_COLLABORATION === "1"

const childMessageSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("ready"),
    port: z.number().int().positive(),
    nodeMajor: z.number().int().positive(),
  }),
  z.strictObject({
    type: z.literal("completed"),
    nodeMajor: z.number().int().positive(),
    report: nativeWorkflowReportSchema,
  }),
  z.strictObject({ type: z.literal("fatal") }),
])

function waitForChildExit(child: ReturnType<typeof spawn>) {
  if (child.exitCode !== null || child.signalCode !== null)
    return Promise.resolve(true)

  return new Promise<boolean>((resolve) => {
    let settled = false

    const timer = setTimeout(function killTimedOutChild() {
      child.kill("SIGKILL")
      finish(false)
    }, 5000)

    function finish(exited: boolean) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.off("exit", onExit)
      resolve(exited)
    }

    function onExit() {
      finish(true)
    }

    child.once("exit", onExit)

    if (child.exitCode !== null || child.signalCode !== null) finish(true)
  })
}

async function nativeNodeWorkflow() {
  const resultsDirectory = join(process.cwd(), "test-results")
  await mkdir(resultsDirectory, { recursive: true })

  const outputDirectory = await mkdtemp(
    join(resultsDirectory, "native-collaboration-node-"),
  )

  const build = await Bun.build({
    entrypoints: [new URL("./native-node-child.ts", import.meta.url).pathname],
    outdir: outputDirectory,
    target: "node",
    format: "esm",
    tsconfig: new URL("../tsconfig.json", import.meta.url).pathname,
    packages: "external",
  }).catch(async function buildFailed() {
    await rm(outputDirectory, { recursive: true, force: true })
    throw new Error("Node native fixture bundle failed")
  })

  if (!build.success) {
    await rm(outputDirectory, { recursive: true, force: true })
    throw new Error("Node native fixture bundle failed")
  }

  const entry = build.outputs.find((output) => output.kind === "entry-point")

  if (!entry) {
    await rm(outputDirectory, { recursive: true, force: true })
    throw new Error("Node native fixture entry was not emitted")
  }

  const child = spawn("node", [entry.path], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  })

  if (!child.stdout || !child.stderr) {
    child.kill("SIGKILL")
    await rm(outputDirectory, { recursive: true, force: true })
    throw new Error("Node native fixture process did not expose output pipes")
  }

  const lines = createInterface({ input: child.stdout })
  const messages: z.infer<typeof childMessageSchema>[] = []
  const waiters: ((message: z.infer<typeof childMessageSchema>) => void)[] = []
  let completed = false

  function enqueue(message: z.infer<typeof childMessageSchema>) {
    const waiter = waiters.shift()

    if (waiter) waiter(message)
    else messages.push(message)
  }

  lines.on("line", function parseChildMessage(line) {
    try {
      const input: unknown = JSON.parse(line)
      const parsed = childMessageSchema.safeParse(input)
      enqueue(parsed.success ? parsed.data : { type: "fatal" })
    } catch {
      enqueue({ type: "fatal" })
    }
  })
  child.stderr.resume()
  child.on("error", function childError() {
    enqueue({ type: "fatal" })
  })
  child.on("exit", function childExit() {
    if (!completed) enqueue({ type: "fatal" })
  })

  function nextMessage() {
    const queued = messages.shift()

    if (queued) return Promise.resolve(queued)

    return new Promise<z.infer<typeof childMessageSchema>>(
      (resolve, reject) => {
        const timer = setTimeout(function messageTimedOut() {
          reject(new Error("Node native fixture did not respond"))
        }, 20000)

        waiters.push(function received(message) {
          clearTimeout(timer)
          resolve(message)
        })
      },
    )
  }

  async function nextMessageOfType(
    expected: "ready" | "completed",
  ): Promise<z.infer<typeof childMessageSchema>> {
    while (true) {
      const message = await nextMessage()

      if (message.type === "fatal")
        throw new Error("Node native fixture process failed")

      if (message.type === expected) return message
    }
  }

  try {
    const ready = await nextMessageOfType("ready")

    if (ready.type !== "ready")
      throw new Error("Node native fixture did not report readiness")
    expect(ready.nodeMajor).toBeGreaterThanOrEqual(22)

    const result = await nextMessageOfType("completed")

    if (result.type !== "completed")
      throw new Error("Node native fixture did not complete its workflow")
    completed = true
    expect(result.nodeMajor).toBe(ready.nodeMajor)
    expect(result.report).toEqual({
      wrongOriginStatus: 403,
      wrongCsrfStatus: 403,
      deniedPermissionStatus: 403,
      updateCount: 1,
      revision: "3",
      cleanedClientCount: 0,
      replayStatus: 401,
      disconnectedUpgradeAborted: true,
      oversizedCloseCode: 1009,
      remainingTicketCount: 0,
    })
    expect(await waitForChildExit(child)).toBe(true)
    expect(child.exitCode).toBe(0)
  } finally {
    lines.close()

    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGKILL")
    await waitForChildExit(child)
    await rm(outputDirectory, { recursive: true, force: true })
  }
}

if (runNative) {
  test("Node http and ws run in an isolated native process", nativeNodeWorkflow)
} else {
  test.skip(
    "Node native collaboration workflow requires RUN_NATIVE_COLLABORATION=1",
    nativeNodeWorkflow,
  )
}
