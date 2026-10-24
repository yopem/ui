import { createNodeEditorCollaborationService } from "@editor/server/collaboration-node"
import { z } from "zod"

import { createNativeCollaborationFixture } from "./native-fixture"
import {
  nativeWorkflowReportSchema,
  runNativeCollaborationWorkflow,
} from "./native-workflow"

const messageSchema = z.discriminatedUnion("type", [
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

function send(message: z.infer<typeof messageSchema>) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

async function main() {
  const fixture = await createNativeCollaborationFixture()
  const runtime = createNodeEditorCollaborationService(fixture.options)

  try {
    await new Promise<void>((resolve, reject) => {
      runtime.server.once("error", reject)
      runtime.server.listen(0, "127.0.0.1", resolve)
    })

    const address = z
      .object({ port: z.number().int().min(1).max(65535) })
      .parse(runtime.server.address())

    const nodeMajor = Number(process.versions.node.split(".")[0])
    send({ type: "ready", port: address.port, nodeMajor })

    if (nodeMajor < 22) throw new Error("Node 22 or later is required")

    const report = await runNativeCollaborationWorkflow(
      `http://127.0.0.1:${address.port}`,
      fixture,
    )

    await runtime.close()
    await fixture.close()
    send({ type: "completed", nodeMajor, report })
  } catch {
    send({ type: "fatal" })
    process.exitCode = 1
    await runtime.close().catch(function shutdownFailed() {
      return undefined
    })
    await fixture.close().catch(function databaseCloseFailed() {
      return undefined
    })
  }
}

void main().catch(function startupFailed() {
  send({ type: "fatal" })
  process.exitCode = 1
})
