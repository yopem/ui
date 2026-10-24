import type { WebSocket } from "ws"

import { strict as assert } from "node:assert"
import * as Y from "yjs"
import { z } from "zod"

import type {
  NativeCollaborationFixture,
  NativeCollaborationStatus,
  NativeRevalidationGate,
} from "./native-fixture"

import {
  applySyncStep2,
  closeNativeSocket,
  issueNativeTicket,
  newNativeSocket,
  parseNativeAcked,
  parseNativeDelivery,
  parseNativeReady,
  receiveNativeMessage,
  requestNativeTicket,
  synchronizeNativeSocket,
  updateFrame,
  waitForNativeClose,
  waitForNativeUpgrade,
} from "./native-client"

export const nativeWorkflowReportSchema = z.strictObject({
  wrongOriginStatus: z.number().int(),
  wrongCsrfStatus: z.number().int(),
  deniedPermissionStatus: z.number().int(),
  updateCount: z.number().int().nonnegative(),
  revision: z.string().regex(/^[1-9][0-9]*$/),
  cleanedClientCount: z.number().int().nonnegative(),
  replayStatus: z.number().int(),
  disconnectedUpgradeAborted: z.boolean(),
  oversizedCloseCode: z.number().int(),
  remainingTicketCount: z.number().int().nonnegative(),
})

export type NativeWorkflowReport = z.infer<typeof nativeWorkflowReportSchema>

async function waitForSignal(promise: Promise<void>, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), 3000)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function waitForStatus(
  fixture: NativeCollaborationFixture,
  accepts: (status: NativeCollaborationStatus) => boolean,
) {
  const deadline = Date.now() + 3000

  while (Date.now() < deadline) {
    const status = await fixture.status()

    if (accepts(status)) return status
    await new Promise<void>((resolve) => setTimeout(resolve, 25))
  }

  throw new Error("native collaboration state did not settle")
}

async function openSocket(
  baseUrl: string,
  ticket: string,
  sockets: Set<WebSocket>,
) {
  const socket = newNativeSocket(baseUrl, ticket)
  sockets.add(socket)
  const firstMessage = receiveNativeMessage(socket)
  void firstMessage.catch(function observeEarlySocketFailure() {
    return undefined
  })
  assert.deepEqual(await waitForNativeUpgrade(socket), { kind: "opened" })
  assert.equal(socket.protocol, "editor-v1")

  return { socket, firstMessage }
}

export async function runNativeCollaborationWorkflow(
  baseUrl: string,
  fixture: NativeCollaborationFixture,
): Promise<NativeWorkflowReport> {
  const sockets = new Set<WebSocket>()
  const documents = new Set<Y.Doc>()
  let gate: NativeRevalidationGate | undefined

  try {
    const wrongOrigin = await requestNativeTicket(baseUrl, fixture, "write", {
      Origin: "https://attacker.test",
    })

    await wrongOrigin.arrayBuffer()
    assert.equal(wrongOrigin.status, 403)

    const wrongCsrf = await requestNativeTicket(baseUrl, fixture, "write", {
      "X-CSRF-Token": "invalid-native-csrf",
    })

    await wrongCsrf.arrayBuffer()
    assert.equal(wrongCsrf.status, 403)

    fixture.setWriteAllowed(false)

    const deniedPermission = await requestNativeTicket(
      baseUrl,
      fixture,
      "write",
    ).finally(function restorePermission() {
      fixture.setWriteAllowed(true)
    })

    await deniedPermission.arrayBuffer()
    const deniedPermissionStatus = deniedPermission.status
    assert.equal(deniedPermissionStatus, 403)

    const writerTicket = await issueNativeTicket(baseUrl, fixture, "write")
    const writerConnection = await openSocket(baseUrl, writerTicket, sockets)
    const writer = writerConnection.socket
    const writerDoc = new Y.Doc()
    documents.add(writerDoc)
    await synchronizeNativeSocket(
      writer,
      writerDoc,
      fixture.generation,
      writerConnection.firstMessage,
    )

    const readerTicket = await issueNativeTicket(baseUrl, fixture, "read")
    const readerConnection = await openSocket(baseUrl, readerTicket, sockets)
    const reader = readerConnection.socket
    const readerDoc = new Y.Doc()
    documents.add(readerDoc)
    await synchronizeNativeSocket(
      reader,
      readerDoc,
      fixture.generation,
      readerConnection.firstMessage,
    )

    writerDoc.getText("content").insert(5, " native")
    const writerUpdate = receiveNativeMessage(writer)
    const writerDelivery = receiveNativeMessage(writer)
    const readerUpdate = receiveNativeMessage(reader)
    const readerDelivery = receiveNativeMessage(reader)
    writer.send(updateFrame(writerDoc), { binary: true })

    const [writerFrame, writerControl, readerFrame, readerControl] =
      await Promise.all([
        writerUpdate,
        writerDelivery,
        readerUpdate,
        readerDelivery,
      ])

    if (writerFrame.kind !== "binary" || readerFrame.kind !== "binary")
      throw new Error("Yjs updates were not sent as binary frames")
    applySyncStep2(readerDoc, readerFrame.bytes)
    assert.equal(readerDoc.getText("content").toJSON(), "saved native")
    const writerDeliveryId = parseNativeDelivery(writerControl)
    const readerDeliveryId = parseNativeDelivery(readerControl)
    writer.send(JSON.stringify({ ack: writerDeliveryId }))
    reader.send(JSON.stringify({ ack: readerDeliveryId }))
    assert.equal(
      parseNativeAcked(await receiveNativeMessage(writer)),
      writerDeliveryId,
    )
    assert.equal(
      parseNativeAcked(await receiveNativeMessage(reader)),
      readerDeliveryId,
    )

    const persisted = await fixture.status()
    assert.equal(persisted.updateCount, 1)
    assert.equal(persisted.revision, "3")
    await Promise.all([closeNativeSocket(writer), closeNativeSocket(reader)])

    const cleaned = await waitForStatus(
      fixture,
      (status) => status.clientCount === 0,
    )

    assert.equal(cleaned.ticketCount, 0)

    const replayTicket = await issueNativeTicket(baseUrl, fixture, "write")
    const firstUseConnection = await openSocket(baseUrl, replayTicket, sockets)
    parseNativeReady(await firstUseConnection.firstMessage)
    await closeNativeSocket(firstUseConnection.socket)
    await waitForStatus(fixture, (status) => status.clientCount === 0)
    const replay = newNativeSocket(baseUrl, replayTicket)
    sockets.add(replay)
    const replayResult = await waitForNativeUpgrade(replay)
    assert.deepEqual(replayResult, { kind: "rejected", status: 401 })

    const disconnectTicket = await issueNativeTicket(baseUrl, fixture, "write")
    gate = fixture.blockNextRevalidation()
    const pending = newNativeSocket(baseUrl, disconnectTicket)
    sockets.add(pending)
    const pendingUpgrade = waitForNativeUpgrade(pending)
    await waitForSignal(
      gate.started,
      "native upgrade did not start revalidation",
    )
    pending.terminate()
    await waitForSignal(
      gate.aborted,
      "native upgrade did not abort on disconnect",
    )
    gate.release(false)
    const pendingResult = await pendingUpgrade
    assert.notEqual(pendingResult.kind, "opened")
    await waitForStatus(fixture, (status) => status.clientCount === 0)

    const boundedTicket = await issueNativeTicket(baseUrl, fixture, "write")
    const boundedConnection = await openSocket(baseUrl, boundedTicket, sockets)
    const bounded = boundedConnection.socket
    parseNativeReady(await boundedConnection.firstMessage)
    const close = waitForNativeClose(bounded)
    bounded.send(new Uint8Array(65537), { binary: true })
    const oversizedCloseCode = await close
    assert.equal(oversizedCloseCode, 1009)

    const finalStatus = await waitForStatus(
      fixture,
      (status) => status.clientCount === 0,
    )

    return {
      wrongOriginStatus: wrongOrigin.status,
      wrongCsrfStatus: wrongCsrf.status,
      deniedPermissionStatus,
      updateCount: finalStatus.updateCount,
      revision: finalStatus.revision,
      cleanedClientCount: finalStatus.clientCount,
      replayStatus: replayResult.kind === "rejected" ? replayResult.status : 0,
      disconnectedUpgradeAborted: pendingResult.kind !== "opened",
      oversizedCloseCode,
      remainingTicketCount: finalStatus.ticketCount,
    }
  } finally {
    gate?.release(false)

    for (const socket of sockets) await closeNativeSocket(socket)

    for (const document of documents) document.destroy()
  }
}
