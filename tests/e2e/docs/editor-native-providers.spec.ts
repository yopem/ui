import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test"
import {
  installHocuspocusTrafficGate,
  installNativeRtcProbe,
  readNativeRtcEvidence,
  watchNativeGrantResponse,
} from "@workspace/tests/e2e/fixtures/native-providers-local/native-provider-assertions"

interface NativeIdentity {
  cookieName: string
  cookieValue: string
  csrf: string
}

interface NativeProviderFixture {
  docsUrl: string
  grantUrl: string
  socketUrl: string
  signalingUrls: string
  roomId: string
  switchRoomId: string
  deniedRoomId: string
  pendingRoomId: string
  writerA: NativeIdentity
  writerB: NativeIdentity
  reader: NativeIdentity
  denied: NativeIdentity
}

const fixtureInputs = [
  "EDITOR_NATIVE_DOCS_URL",
  "EDITOR_NATIVE_GRANT_URL",
  "EDITOR_NATIVE_SOCKET_URL",
  "EDITOR_NATIVE_SIGNALING_URLS",
  "EDITOR_NATIVE_ROOM_ID",
  "EDITOR_NATIVE_SWITCH_ROOM_ID",
  "EDITOR_NATIVE_DENIED_ROOM_ID",
  "EDITOR_NATIVE_PENDING_ROOM_ID",
  "EDITOR_NATIVE_WRITER_A_COOKIE_NAME",
  "EDITOR_NATIVE_WRITER_A_COOKIE_VALUE",
  "EDITOR_NATIVE_WRITER_A_CSRF",
  "EDITOR_NATIVE_WRITER_B_COOKIE_NAME",
  "EDITOR_NATIVE_WRITER_B_COOKIE_VALUE",
  "EDITOR_NATIVE_WRITER_B_CSRF",
  "EDITOR_NATIVE_READER_COOKIE_NAME",
  "EDITOR_NATIVE_READER_COOKIE_VALUE",
  "EDITOR_NATIVE_READER_CSRF",
  "EDITOR_NATIVE_DENIED_COOKIE_NAME",
  "EDITOR_NATIVE_DENIED_COOKIE_VALUE",
  "EDITOR_NATIVE_DENIED_CSRF",
] as const

test.use({ screenshot: "off", trace: "off", video: "off" })

function readIdentity(prefix: string): NativeIdentity | undefined {
  const cookieName = process.env[`${prefix}_COOKIE_NAME`]
  const cookieValue = process.env[`${prefix}_COOKIE_VALUE`]
  const csrf = process.env[`${prefix}_CSRF`]

  if (!cookieName || !cookieValue || !csrf) return undefined

  return { cookieName, cookieValue, csrf }
}

function readNativeFixture(): NativeProviderFixture | undefined {
  const writerA = readIdentity("EDITOR_NATIVE_WRITER_A")
  const writerB = readIdentity("EDITOR_NATIVE_WRITER_B")
  const reader = readIdentity("EDITOR_NATIVE_READER")
  const denied = readIdentity("EDITOR_NATIVE_DENIED")
  const docsUrl = process.env.EDITOR_NATIVE_DOCS_URL
  const grantUrl = process.env.EDITOR_NATIVE_GRANT_URL
  const socketUrl = process.env.EDITOR_NATIVE_SOCKET_URL
  const signalingUrls = process.env.EDITOR_NATIVE_SIGNALING_URLS
  const roomId = process.env.EDITOR_NATIVE_ROOM_ID
  const switchRoomId = process.env.EDITOR_NATIVE_SWITCH_ROOM_ID
  const deniedRoomId = process.env.EDITOR_NATIVE_DENIED_ROOM_ID
  const pendingRoomId = process.env.EDITOR_NATIVE_PENDING_ROOM_ID

  if (
    !writerA ||
    !writerB ||
    !reader ||
    !denied ||
    !docsUrl ||
    !grantUrl ||
    !socketUrl ||
    !signalingUrls?.trim() ||
    !roomId ||
    !switchRoomId ||
    !deniedRoomId ||
    !pendingRoomId
  )
    return undefined

  return {
    docsUrl,
    grantUrl,
    socketUrl,
    signalingUrls,
    roomId,
    switchRoomId,
    deniedRoomId,
    pendingRoomId,
    writerA,
    writerB,
    reader,
    denied,
  }
}

function nativeFixtureSkipReason() {
  if (process.env.RUN_EDITOR_NATIVE_PROVIDERS !== "1")
    return "Set RUN_EDITOR_NATIVE_PROVIDERS=1 and configure the HTTPS host fixture."

  const missing = fixtureInputs.filter((name) => !process.env[name]?.trim())

  return missing.length
    ? `Configure the authorized host inputs: ${missing.join(", ")}.`
    : ""
}

function requireNativeFixture() {
  const reason = nativeFixtureSkipReason()
  test.skip(Boolean(reason), reason)

  return readNativeFixture()
}

function assertHostUrls(fixture: NativeProviderFixture) {
  const docs = new URL(fixture.docsUrl)
  const grant = new URL(fixture.grantUrl)
  const socket = new URL(fixture.socketUrl)
  const socketOrigin = new URL(socket.href)
  socketOrigin.protocol = "https:"

  expect(docs.protocol).toBe("https:")
  expect(docs.hostname).toBe("127.0.0.1")
  expect(docs.port).toBe("3443")
  expect(docs.pathname).toBe("/editor/examples")
  expect(docs.hash).toBe("#native-collaboration")
  expect(docs.username).toBe("")
  expect(docs.password).toBe("")
  expect(docs.search).toBe("")
  expect(grant.protocol).toBe("https:")
  expect(grant.origin).toBe(docs.origin)
  expect(grant.pathname).toBe("/api/native-grant")
  expect(grant.username).toBe("")
  expect(grant.password).toBe("")
  expect(grant.search).toBe("")
  expect(grant.hash).toBe("")
  expect(socket.protocol).toBe("wss:")
  expect(socket.origin).toBe("wss://127.0.0.1:3443")
  expect(socket.pathname).toBe("/native-collaboration/socket")
  expect(socket.username).toBe("")
  expect(socket.password).toBe("")
  expect(socket.search).toBe("")
  expect(socket.hash).toBe("")
  expect(socketOrigin.origin).toBe(docs.origin)

  const signalingUrls = fixture.signalingUrls
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)

  expect(signalingUrls.length).toBeGreaterThan(0)

  for (const value of signalingUrls) {
    const signaling = new URL(value)
    const signalingOrigin = new URL(signaling.href)
    signalingOrigin.protocol = "https:"

    expect(signaling.protocol).toBe("wss:")
    expect(signaling.origin).toBe(socket.origin)
    expect(signalingOrigin.origin).toBe(docs.origin)
    expect(signaling.pathname).toBe("/signaling")
    expect(signaling.username).toBe("")
    expect(signaling.password).toBe("")
    expect(signaling.search).toBe("")
    expect(signaling.hash).toBe("")
  }
}

async function createIdentityContext(
  browser: Browser,
  docsUrl: string,
  identity: NativeIdentity,
) {
  const context = await browser.newContext()
  const origin = new URL(docsUrl).origin

  await context.addCookies([
    {
      name: identity.cookieName,
      value: identity.cookieValue,
      url: origin,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ])

  return context
}

async function openNativeExample(page: Page, docsUrl: string) {
  await page.goto(docsUrl)
  await expect(page).toHaveURL(docsUrl)

  const card = page.getByTestId("editor-example-native-collaboration")
  await expect(card).toBeVisible()
  await expect(card.locator('[data-slot="editor-content"]')).toHaveCount(0)
  await card.getByRole("button", { name: "Live preview", exact: true }).click()

  const region = card.getByTestId("public-native-collaboration-example")
  await expect(region).toBeVisible()

  return region
}

async function fillConnectionFields(
  region: Locator,
  fixture: NativeProviderFixture,
  identity: NativeIdentity,
  roomId: string,
  displayName: string,
  requestedPermission: "read" | "write" = "write",
) {
  await region.getByLabel("Room ID").fill(roomId)
  await region
    .getByRole("button", { name: "Apply room ID", exact: true })
    .click()
  await expect(
    region.getByText(`Active room ID: ${roomId}`, { exact: true }),
  ).toBeVisible()
  await region.getByLabel("HTTPS grant endpoint").fill(fixture.grantUrl)
  await region.getByLabel("WSS Hocuspocus endpoint").fill(fixture.socketUrl)
  await region.getByLabel("Host CSRF token").fill(identity.csrf)
  await region
    .getByLabel("Optional WSS signaling URLs")
    .fill(fixture.signalingUrls)
  await region.getByLabel("Requested display name").fill(displayName)

  const readOnlyRequest = region.getByRole("checkbox", {
    name: "Request read-only access",
    exact: true,
  })

  if (requestedPermission === "read") await readOnlyRequest.check()
  else await readOnlyRequest.uncheck()
}

function isCsrfInputEmpty(region: Locator) {
  return region
    .getByLabel("Host CSRF token")
    .evaluate(
      (element) =>
        element instanceof HTMLInputElement && element.value.length === 0,
    )
}

async function connectToRoom(
  region: Locator,
  fixture: NativeProviderFixture,
  identity: NativeIdentity,
  roomId: string,
  displayName: string,
  requestedPermission: "read" | "write" = "write",
) {
  await fillConnectionFields(
    region,
    fixture,
    identity,
    roomId,
    displayName,
    requestedPermission,
  )
  await region
    .getByRole("button", { name: "Connect to host", exact: true })
    .click()
  await expect.poll(() => isCsrfInputEmpty(region)).toBe(true)

  const tokenExposure = await region.evaluate((element, token) => {
    const document = element.ownerDocument
    const view = document.defaultView

    if (!view) return false

    const stored = [view.localStorage, view.sessionStorage].some((storage) =>
      Array.from({ length: storage.length }, (_, index) => {
        const key = storage.key(index)

        return key ? (storage.getItem(key)?.includes(token) ?? false) : false
      }).some(Boolean),
    )

    return (
      stored || (document.documentElement?.outerHTML.includes(token) ?? false)
    )
  }, identity.csrf)

  expect(tokenExposure).toBe(false)

  return region.getByRole("textbox", {
    name: "Native collaboration editor",
    exact: true,
  })
}

async function expectNoUnconfirmedUpdates(region: Locator) {
  await expect(
    region.getByText(
      /Hocuspocus socket:\s*connected;\s*authenticated:\s*true;\s*Yjs-synced:\s*true;\s*unconfirmed updates:\s*0\./,
    ),
  ).toBeVisible({ timeout: 30_000 })
}

async function expectConnected(region: Locator) {
  await expect(region.getByText("Connected", { exact: true })).toBeVisible({
    timeout: 30_000,
  })
  await expect(
    region.getByText(
      /Hocuspocus socket:\s*connected;\s*authenticated:\s*true;\s*Yjs-synced:\s*true;\s*unconfirmed updates:\s*\d+\./,
    ),
  ).toBeVisible()
  await expect(
    region.getByText(
      /WebRTC:\s*[a-z]+;\s*reported WebRTC peers:\s*\d+;\s*BroadcastChannel peers:\s*\d+\./,
    ),
  ).toBeVisible()
}

function watchSocketCloses(page: Page, socketUrl: string) {
  const socketPath = new URL(socketUrl).pathname
  let closed = 0

  page.on("websocket", (socket) => {
    if (new URL(socket.url()).pathname === socketPath)
      socket.on("close", () => {
        closed += 1
      })
  })

  return function closedSocketCount() {
    return closed
  }
}

test("native providers sync through WebRTC, reopen Hocuspocus in-memory state, and switch rooms", async ({
  browser,
}, testInfo) => {
  const fixture = requireNativeFixture()

  if (!fixture) return
  assertHostUrls(fixture)
  test.setTimeout(120_000)

  const contextA = await createIdentityContext(
    browser,
    fixture.docsUrl,
    fixture.writerA,
  )

  const contextB = await createIdentityContext(
    browser,
    fixture.docsUrl,
    fixture.writerB,
  )

  let writerContextsClosed = false

  try {
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()
    await pageA.addInitScript(installNativeRtcProbe)
    await pageB.addInitScript(installNativeRtcProbe)

    const trafficGateA = await installHocuspocusTrafficGate(
      pageA,
      fixture.socketUrl,
    )

    const trafficGateB = await installHocuspocusTrafficGate(
      pageB,
      fixture.socketUrl,
    )

    const closedSocketCountA = watchSocketCloses(pageA, fixture.socketUrl)
    const closedSocketCountB = watchSocketCloses(pageB, fixture.socketUrl)
    const regionA = await openNativeExample(pageA, fixture.docsUrl)
    const regionB = await openNativeExample(pageB, fixture.docsUrl)

    const editorA = await connectToRoom(
      regionA,
      fixture,
      fixture.writerA,
      fixture.roomId,
      "Native writer A",
    )

    const editorB = await connectToRoom(
      regionB,
      fixture,
      fixture.writerB,
      fixture.roomId,
      "Native writer B",
    )

    await expectConnected(regionA)
    await expectConnected(regionB)
    await expect(editorA).toHaveAttribute("contenteditable", "true")
    await expect(editorB).toHaveAttribute("contenteditable", "true")
    await expect(editorA).toHaveText(
      `Authoritative Lexical seed for ${fixture.roomId}`,
    )
    await expect(editorB).toHaveText(
      `Authoritative Lexical seed for ${fixture.roomId}`,
    )
    await expect
      .poll(
        async () => {
          const [evidenceA, evidenceB] = await Promise.all([
            readNativeRtcEvidence(pageA),
            readNativeRtcEvidence(pageB),
          ])

          return (
            evidenceA.connectedPeerConnections > 0 &&
            evidenceA.openDataChannels > 0 &&
            evidenceA.dataChannelStats > 0 &&
            evidenceB.connectedPeerConnections > 0 &&
            evidenceB.openDataChannels > 0 &&
            evidenceB.dataChannelStats > 0
          )
        },
        { timeout: 30_000 },
      )
      .toBe(true)

    const [rtcBaselineA, rtcBaselineB] = await Promise.all([
      readNativeRtcEvidence(pageA),
      readNativeRtcEvidence(pageB),
    ])

    const closedBeforeGateA = closedSocketCountA()
    const closedBeforeGateB = closedSocketCountB()
    const rtcOnlyUpdate = `WebRTC-only update ${Date.now()}`

    trafficGateA.block()
    trafficGateB.block()
    expect(trafficGateA.isBlocking()).toBe(true)
    expect(trafficGateB.isBlocking()).toBe(true)
    await editorA.fill(rtcOnlyUpdate)
    await expect(editorB).toHaveText(rtcOnlyUpdate, { timeout: 30_000 })
    await expect
      .poll(
        async () => {
          const [evidenceA, evidenceB] = await Promise.all([
            readNativeRtcEvidence(pageA),
            readNativeRtcEvidence(pageB),
          ])

          return (
            evidenceA.bytesSent > rtcBaselineA.bytesSent &&
            evidenceB.bytesReceived > rtcBaselineB.bytesReceived &&
            trafficGateA.suppressedClientMessages() > 0
          )
        },
        { timeout: 30_000 },
      )
      .toBe(true)
    await expectConnected(regionA)
    await expectConnected(regionB)
    expect(closedSocketCountA()).toBe(closedBeforeGateA)
    expect(closedSocketCountB()).toBe(closedBeforeGateB)

    const [rtcAfterA, rtcAfterB] = await Promise.all([
      readNativeRtcEvidence(pageA),
      readNativeRtcEvidence(pageB),
    ])

    await testInfo.attach("native-rtc-isolated-update", {
      body: JSON.stringify({
        writerA: { before: rtcBaselineA, after: rtcAfterA },
        writerB: { before: rtcBaselineB, after: rtcAfterB },
        heldHocuspocusMessages: {
          writerA: trafficGateA.suppressedClientMessages(),
          writerB: trafficGateB.suppressedClientMessages(),
        },
        closedSockets: {
          writerA: closedSocketCountA(),
          writerB: closedSocketCountB(),
        },
      }),
      contentType: "application/json",
    })

    trafficGateA.release()
    trafficGateB.release()
    await editorB.fill("Writer B update")
    await expect(editorA).toHaveText("Writer B update", { timeout: 30_000 })
    await expectNoUnconfirmedUpdates(regionA)
    await expectNoUnconfirmedUpdates(regionB)

    const persistedPage = await contextA.newPage()

    const persistedRegion = await openNativeExample(
      persistedPage,
      fixture.docsUrl,
    )

    await expect(persistedRegion.getByLabel("Room ID")).toHaveValue(
      fixture.roomId,
    )

    await regionA.getByLabel("Room ID").fill(fixture.switchRoomId)
    await regionA
      .getByRole("button", { name: "Apply room ID", exact: true })
      .click()
    await expect(
      regionA.getByRole("textbox", {
        name: "Native collaboration editor",
        exact: true,
      }),
    ).toHaveCount(0)
    await expect
      .poll(closedSocketCountA, { timeout: 30_000 })
      .toBeGreaterThan(closedBeforeGateA)

    const switchedEditor = await connectToRoom(
      regionA,
      fixture,
      fixture.writerA,
      fixture.switchRoomId,
      "Native writer A",
    )

    await expectConnected(regionA)
    await expect(switchedEditor).toHaveAttribute("contenteditable", "true")

    await Promise.all([contextA.close(), contextB.close()])
    writerContextsClosed = true

    const reopenedContext = await createIdentityContext(
      browser,
      fixture.docsUrl,
      fixture.writerA,
    )

    try {
      const reopenedPage = await reopenedContext.newPage()

      const reopenedRegion = await openNativeExample(
        reopenedPage,
        fixture.docsUrl,
      )

      const reopenedEditor = await connectToRoom(
        reopenedRegion,
        fixture,
        fixture.writerA,
        fixture.roomId,
        "Native writer A reopened",
      )

      await expectConnected(reopenedRegion)
      await expect(reopenedEditor).toHaveText("Writer B update", {
        timeout: 30_000,
      })
      await expectNoUnconfirmedUpdates(reopenedRegion)
    } finally {
      await reopenedContext.close()
    }
  } finally {
    if (!writerContextsClosed)
      await Promise.all([contextA.close(), contextB.close()])
  }
})

test("server grants enforce read-only access and denial", async ({
  browser,
}) => {
  const fixture = requireNativeFixture()

  if (!fixture) return
  assertHostUrls(fixture)
  test.setTimeout(120_000)

  const readerContext = await createIdentityContext(
    browser,
    fixture.docsUrl,
    fixture.reader,
  )

  const deniedContext = await createIdentityContext(
    browser,
    fixture.docsUrl,
    fixture.denied,
  )

  try {
    const readerPage = await readerContext.newPage()
    const readerRegion = await openNativeExample(readerPage, fixture.docsUrl)

    const readerGrantResponse = watchNativeGrantResponse(
      readerPage,
      fixture.grantUrl,
    )

    const readerEditor = await connectToRoom(
      readerRegion,
      fixture,
      fixture.reader,
      fixture.roomId,
      "Native read-only peer",
      "read",
    )

    const readGrant = await readerGrantResponse

    expect(readGrant.status).toBe(200)
    expect(readGrant.permission).toBe("read")
    expect(readGrant.peerIsNull).toBe(true)
    await expectConnected(readerRegion)
    await expect(
      readerRegion.getByText(/Server write access:\s*disabled\./),
    ).toBeVisible()
    await expect(readerEditor).toHaveAttribute("contenteditable", "false")

    const unauthorizedWriteStatus = await readerPage.evaluate(
      async ({ grantUrl, roomId, csrf }) => {
        const response = await fetch(grantUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
          },
          body: JSON.stringify({
            roomId,
            displayName: "Unauthorized reader write",
            cursorColor: "#3466aa",
            requestedPermission: "write",
          }),
          cache: "no-store",
        })

        await response.body?.cancel()

        return response.status
      },
      {
        grantUrl: fixture.grantUrl,
        roomId: fixture.roomId,
        csrf: fixture.reader.csrf,
      },
    )

    expect(unauthorizedWriteStatus).toBe(403)

    const deniedPage = await deniedContext.newPage()
    const deniedRegion = await openNativeExample(deniedPage, fixture.docsUrl)

    const deniedEditor = await connectToRoom(
      deniedRegion,
      fixture,
      fixture.denied,
      fixture.deniedRoomId,
      "Denied native peer",
    )

    await expect(
      deniedRegion.getByText("Access denied", { exact: true }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      deniedRegion.getByText(/Server write access:\s*disabled\./),
    ).toBeVisible()
    await expect(deniedEditor).toHaveAttribute("contenteditable", "false")
  } finally {
    await Promise.all([readerContext.close(), deniedContext.close()])
  }
})

test("native provider aborts pending grant on SPA navigation", async ({
  browser,
}) => {
  const fixture = requireNativeFixture()

  if (!fixture) return
  assertHostUrls(fixture)
  test.setTimeout(120_000)

  const context = await createIdentityContext(
    browser,
    fixture.docsUrl,
    fixture.writerA,
  )

  try {
    const page = await context.newPage()
    const region = await openNativeExample(page, fixture.docsUrl)
    await fillConnectionFields(
      region,
      fixture,
      fixture.writerA,
      fixture.pendingRoomId,
      "Pending native peer",
    )

    const pendingGrant = page.waitForRequest((request) => {
      const actual = new URL(request.url())
      const expected = new URL(fixture.grantUrl)

      return (
        request.method() === "POST" &&
        actual.origin === expected.origin &&
        actual.pathname === expected.pathname
      )
    })

    const abortedGrant = page.waitForEvent("requestfailed", (request) => {
      const actual = new URL(request.url())
      const expected = new URL(fixture.grantUrl)

      return (
        request.method() === "POST" &&
        actual.origin === expected.origin &&
        actual.pathname === expected.pathname
      )
    })

    await region
      .getByRole("button", { name: "Connect to host", exact: true })
      .click()
    await expect.poll(() => isCsrfInputEmpty(region)).toBe(true)
    await pendingGrant

    const navigation = page.getByRole("navigation", {
      name: "Documentation",
      exact: true,
    })

    await navigation
      .getByRole("button", { name: "Editor", exact: true })
      .click()
    await navigation
      .getByRole("link", { name: "Document storage", exact: true })
      .click()
    await expect(page).toHaveURL(
      new URL("/docs/editor-store", fixture.docsUrl).href,
    )
    const failedRequest = await abortedGrant
    expect(failedRequest.failure()).not.toBeNull()
  } finally {
    await context.close()
  }
})
