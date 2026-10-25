import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const exampleURL = "/editor/examples#native-collaboration"

const grantURL = "https://native-host.example.test/grants"

const socketURL = "wss://native-host.example.test/rooms"

test("room settings persist into another tab without sending host credentials", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  let grantRequests = 0
  let sockets = 0
  page.on("request", (request) => {
    if (request.url() === grantURL) grantRequests += 1
  })
  page.on("websocket", (socket) => {
    if (socket.url() === socketURL) sockets += 1
  })
  await page.goto(exampleURL, { waitUntil: "domcontentloaded" })
  const card = page.getByTestId("editor-example-native-collaboration")
  await card.getByRole("button", { name: "Live preview", exact: true }).click()
  const example = page.getByTestId("public-native-collaboration-example")
  const room = example.getByLabel("Room ID", { exact: true })
  await expect(room).toBeVisible()
  await room.fill("tenant:persisted-room")
  await example
    .getByRole("button", { name: "Apply room ID", exact: true })
    .click()
  await expect(
    example.getByText("Active room ID: tenant:persisted-room", { exact: true }),
  ).toBeVisible()
  await example
    .getByLabel("HTTPS grant endpoint", { exact: true })
    .fill(grantURL)
  await example
    .getByLabel("WSS Hocuspocus endpoint", { exact: true })
    .fill(socketURL)
  await example
    .getByLabel("Host CSRF token", { exact: true })
    .fill("fixture-csrf-not-real")

  const second = await context.newPage()

  try {
    await second.goto(exampleURL, { waitUntil: "domcontentloaded" })
    await second
      .getByTestId("editor-example-native-collaboration")
      .getByRole("button", { name: "Live preview", exact: true })
      .click()

    const secondExample = second.getByTestId(
      "public-native-collaboration-example",
    )

    await expect(
      secondExample.getByLabel("Room ID", { exact: true }),
    ).toHaveValue("tenant:persisted-room")
    await expect(
      secondExample.getByLabel("Host CSRF token", { exact: true }),
    ).toHaveValue("")
    await expect(
      secondExample.getByLabel("HTTPS grant endpoint", { exact: true }),
    ).toHaveValue("")
    await expect(
      secondExample.getByLabel("WSS Hocuspocus endpoint", { exact: true }),
    ).toHaveValue("")
    await expect(secondExample.locator('[contenteditable="true"]')).toHaveCount(
      0,
    )

    await example.getByRole("button", { name: "New room", exact: true }).click()
    await expect(room).not.toHaveValue("tenant:persisted-room")
    const generated = await room.inputValue()
    expect(generated).toMatch(/^native:[a-f0-9-]{36}$/)
    await second.reload({ waitUntil: "domcontentloaded" })
    await second
      .getByTestId("editor-example-native-collaboration")
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
    await expect(
      second
        .getByTestId("public-native-collaboration-example")
        .getByLabel("Room ID", { exact: true }),
    ).toHaveValue(generated)

    const axe = await new AxeBuilder({ page })
      .include('[data-testid="public-native-collaboration-example"]')
      .analyze()

    expect(axe.violations).toEqual([])
    expect(grantRequests).toBe(0)
    expect(sockets).toBe(0)
    await testInfo.attach("native-room-settings", {
      body: JSON.stringify({
        generated,
        grantRequests,
        sockets,
        credentialsPersisted: false,
      }),
      contentType: "application/json",
    })
  } finally {
    await second.close()
  }
})

test("invalid room changes preserve the active room and create no editable root", async ({
  page,
}) => {
  test.slow()
  await page.goto(exampleURL, { waitUntil: "domcontentloaded" })
  await page
    .getByTestId("editor-example-native-collaboration")
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const example = page.getByTestId("public-native-collaboration-example")
  const room = example.getByLabel("Room ID", { exact: true })
  await expect(room).toBeVisible()
  const original = await room.inputValue()
  await room.fill("not a room")
  await example
    .getByRole("button", { name: "Apply room ID", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(
    example.getByText(`Active room ID: ${original}`, { exact: true }),
  ).toBeVisible()
  await expect(example.locator('[contenteditable="true"]')).toHaveCount(0)
  await room.fill(original)
  await example
    .getByRole("button", { name: "Apply room ID", exact: true })
    .click()
  await expect(example.getByRole("alert")).toHaveCount(0)
})
