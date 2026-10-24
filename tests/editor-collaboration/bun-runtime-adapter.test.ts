import { createBunEditorCollaborationService } from "@editor/server/collaboration-bun"
import { expect, test } from "bun:test"

import { createNativeCollaborationFixture } from "./native-fixture"
import { runNativeCollaborationWorkflow } from "./native-workflow"

const runNative = process.env.RUN_NATIVE_COLLABORATION === "1"

async function nativeBunWorkflow() {
  const fixture = await createNativeCollaborationFixture()

  try {
    const runtime = createBunEditorCollaborationService(fixture.options)

    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: runtime.fetch,
      websocket: runtime.websocket,
    })

    try {
      const report = await runNativeCollaborationWorkflow(
        `http://127.0.0.1:${server.port}`,
        fixture,
      )

      expect(report).toEqual({
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
    } finally {
      await server.stop(true)
    }
  } finally {
    await fixture.close()
  }
}

if (runNative) {
  test(
    "Bun.serve authenticates native collaboration workflows",
    nativeBunWorkflow,
    60_000,
  )
} else {
  test.skip(
    "Bun.serve native collaboration workflow requires RUN_NATIVE_COLLABORATION=1",
    nativeBunWorkflow,
    60_000,
  )
}
