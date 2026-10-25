import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.use({ trace: "off", video: "off" })

function requiredEnv(name: string) {
  const value = process.env[name]

  if (!value) throw new Error(`Set ${name} to run public collaboration E2E.`)

  return value
}

test("public collaboration syncs two clients and keeps controls independent @a11y", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    process.env.RUN_EDITOR_COLLABORATION_E2E !== "1",
    "Requires an explicit initialized HTTPS test host and test-only authentication.",
  )
  test.slow()
  const origin = new URL(requiredEnv("EDITOR_COLLABORATION_E2E_ORIGIN"))
  const documentId = requiredEnv("EDITOR_COLLABORATION_E2E_DOCUMENT_ID")
  const ticketUrl = new URL(requiredEnv("EDITOR_COLLABORATION_E2E_TICKET_URL"))
  const socketUrl = new URL(requiredEnv("EDITOR_COLLABORATION_E2E_SOCKET_URL"))
  const cookieName = requiredEnv("EDITOR_COLLABORATION_E2E_COOKIE_NAME")
  const cookieValue = requiredEnv("EDITOR_COLLABORATION_E2E_COOKIE_VALUE")
  const csrfToken = requiredEnv("EDITOR_COLLABORATION_E2E_CSRF_TOKEN")
  const socketOrigin = new URL(socketUrl)
  socketOrigin.protocol = "https:"

  if (
    origin.protocol !== "https:" ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    ticketUrl.protocol !== "https:" ||
    socketUrl.protocol !== "wss:" ||
    ticketUrl.origin !== origin.origin ||
    socketOrigin.origin !== origin.origin ||
    ticketUrl.search ||
    ticketUrl.hash ||
    ticketUrl.username ||
    ticketUrl.password ||
    socketUrl.search ||
    socketUrl.hash ||
    socketUrl.username ||
    socketUrl.password
  )
    throw new Error(
      "Collaboration E2E endpoints must be secure and same-origin.",
    )

  await context.addCookies([
    {
      name: cookieName,
      value: cookieValue,
      url: origin.origin,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ])

  const pageErrors: string[] = []
  let openedSockets = 0
  let closedSockets = 0

  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })
  page.on("websocket", (socket) => {
    if (new URL(socket.url()).href !== socketUrl.href) return
    openedSockets += 1
    socket.on("close", () => {
      closedSockets += 1
    })
  })

  await page.goto(
    new URL("/editor/examples#public-collaboration", origin).toString(),
  )

  const example = page.getByTestId("editor-example-public-collaboration")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const demo = example.getByTestId("public-collaboration-example")

  const ready = demo.getByRole("button", {
    name: "Confirm host setup",
    exact: true,
  })

  const connect = demo.getByRole("button", {
    name: "Connect both clients",
    exact: true,
  })

  await expect(connect).toBeDisabled()
  await expect(demo.locator("[contenteditable]")).toHaveCount(0)
  await demo
    .getByRole("textbox", { name: "Document ID", exact: true })
    .fill(documentId)
  await demo
    .getByRole("textbox", { name: "Ticket endpoint", exact: true })
    .fill("https://attacker.invalid/collaboration/ticket")
  await demo
    .getByRole("textbox", { name: "WebSocket endpoint", exact: true })
    .fill("wss://attacker.invalid/collaboration/socket")
  await demo.getByLabel("CSRF token", { exact: true }).fill(csrfToken)
  await ready.click()
  await expect(connect).toBeEnabled()
  await connect.click()
  await expect(demo.getByRole("alert")).toBeVisible()
  await expect(demo.locator("[contenteditable]")).toHaveCount(0)

  await demo
    .getByRole("textbox", { name: "Ticket endpoint", exact: true })
    .fill(ticketUrl.toString())
  await demo
    .getByRole("textbox", { name: "WebSocket endpoint", exact: true })
    .fill(socketUrl.toString())
  await expect(connect).toBeDisabled()
  await ready.click()
  await expect(ready).toHaveAttribute("aria-pressed", "true")
  await connect.click()

  const clientA = demo.getByRole("region", { name: "Client A", exact: true })
  const clientB = demo.getByRole("region", { name: "Client B", exact: true })

  const editorA = clientA.getByRole("textbox", {
    name: "Client A shared editor",
    exact: true,
  })

  const editorB = clientB.getByRole("textbox", {
    name: "Client B shared editor",
    exact: true,
  })

  const statusA = clientA.locator("output")
  const statusB = clientB.locator("output")

  await expect(statusA).toHaveText("Connected")
  await expect(statusB).toHaveText("Connected")
  await expect(editorA).toHaveAttribute("contenteditable", "true")
  await expect(editorB).toHaveAttribute("contenteditable", "true")
  await editorA.fill("Client A server-synced draft")
  await expect(editorB).toHaveText("Client A server-synced draft")

  const readOnlyA = clientA.getByRole("button", {
    name: "Toggle Client A read only",
    exact: true,
  })

  const readOnlyB = clientB.getByRole("button", {
    name: "Toggle Client B read only",
    exact: true,
  })

  await readOnlyB.click()
  await expect(readOnlyB).toHaveAttribute("aria-pressed", "true")
  await expect(editorB).toHaveAttribute("contenteditable", "false")
  await expect(editorA).toHaveAttribute("contenteditable", "true")
  await readOnlyA.click()
  await expect(readOnlyA).toHaveAttribute("aria-pressed", "true")
  await expect(editorA).toHaveAttribute("contenteditable", "false")
  await expect(editorB).toHaveAttribute("contenteditable", "false")
  await readOnlyA.click()
  await expect(readOnlyA).toHaveAttribute("aria-pressed", "false")
  await expect(editorA).toHaveAttribute("contenteditable", "true")
  await expect(editorB).toHaveAttribute("contenteditable", "false")

  await clientB
    .getByRole("button", { name: "Disconnect Client B", exact: true })
    .click()
  await expect(statusB).toHaveText("Disconnected")
  await expect(statusA).toHaveText("Connected")
  await expect(editorB).toHaveText("Client A server-synced draft")

  const disconnectedAxe = await new AxeBuilder({ page })
    .include('[data-testid="public-collaboration-example"]')
    .analyze()

  expect(disconnectedAxe.violations).toEqual([])
  await testInfo.attach("public-collaboration-disconnected-axe.json", {
    body: JSON.stringify(disconnectedAxe, null, 2),
    contentType: "application/json",
  })

  await clientB
    .getByRole("button", { name: "Reconnect Client B", exact: true })
    .click()
  await expect(statusB).toHaveText("Connected")
  await expect(editorB).toHaveAttribute("contenteditable", "false")
  await expect(editorA).toHaveAttribute("contenteditable", "true")
  await readOnlyB.click()
  await expect(editorB).toHaveAttribute("contenteditable", "true")
  await editorB.fill("Client B server-synced draft")
  await expect(editorA).toHaveText("Client B server-synced draft")

  const connectedAxe = await new AxeBuilder({ page })
    .include('[data-testid="public-collaboration-example"]')
    .analyze()

  expect(connectedAxe.violations).toEqual([])
  await testInfo.attach("public-collaboration-connected-axe.json", {
    body: JSON.stringify(connectedAxe, null, 2),
    contentType: "application/json",
  })
  await testInfo.attach("public-collaboration-state.json", {
    body: JSON.stringify({
      clientAStatus: await statusA.textContent(),
      clientBStatus: await statusB.textContent(),
      sharedText: await editorA.innerText(),
      openedSockets,
      closedSockets,
    }),
    contentType: "application/json",
  })

  await page.goto(new URL("/", origin).toString())
  await expect.poll(() => closedSockets).toBe(openedSockets)
  expect(openedSockets).toBeGreaterThanOrEqual(3)
  expect(pageErrors).toEqual([])
})
