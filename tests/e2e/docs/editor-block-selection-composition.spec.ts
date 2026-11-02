import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"

async function openSelection(page: Page) {
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="editor-block-selection"]').first()

  const editor = demo.getByRole("textbox", {
    name: "Block selection editor",
    exact: true,
  })

  const selects = demo.getByRole("button", { name: /^Select block / })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(selects).toHaveCount(3)

  return { demo, editor, selects }
}

async function observeKeys(demo: Locator) {
  await demo.evaluate((element) => {
    const events: {
      key: string
      keyCode: number
      composing: boolean
      trusted: boolean
      prevented: boolean
    }[] = []

    element.setAttribute("data-block-key-events", "[]")
    element.ownerDocument.addEventListener(
      "keydown",
      function observe(event) {
        if (!event.composedPath().includes(element)) return
        setTimeout(() => {
          events.push({
            key: event.key,
            keyCode: event.keyCode,
            composing: event.isComposing,
            trusted: event.isTrusted,
            prevented: event.defaultPrevented,
          })
          element.setAttribute("data-block-key-events", JSON.stringify(events))
        }, 0)
      },
      true,
    )
  })
}

async function readKeys(demo: Locator) {
  const events: unknown = JSON.parse(
    (await demo.getAttribute("data-block-key-events")) ?? "[]",
  )

  return events
}

async function saveEvidence(demo: Locator, testInfo: TestInfo) {
  await testInfo.attach("block-selection-keyboard.json", {
    body: JSON.stringify(
      await demo.evaluate((element) => {
        const active = element.ownerDocument.activeElement
        const content = element.querySelector('[data-slot="editor-content"]')

        const native = element.querySelector(
          '[data-slot="block-selection-evidence"]',
        )

        const events: unknown = JSON.parse(
          element.getAttribute("data-block-key-events") ?? "[]",
        )

        return {
          recordedAt: new Date().toISOString(),
          events,
          wrapperEscapeCount: element.getAttribute("data-wrapper-escape-count"),
          content: content?.textContent,
          rawDOM: content?.innerHTML,
          native: native
            ? Object.fromEntries(
                Array.from(native.attributes, ({ name, value }) => [
                  name,
                  value,
                ]),
              )
            : null,
          focus: {
            inside: active !== null && element.contains(active),
            label: active?.getAttribute("aria-label"),
            slot: active?.getAttribute("data-slot"),
          },
        }
      }),
    ),
    contentType: "application/json",
  })
}

test.afterEach(async ({ page }, testInfo) => {
  const demo = page.locator('[data-slot="block-selection-preview"]').first()

  if (await demo.count()) await saveEvidence(demo, testInfo)
})

function nativeEvidence(demo: Locator) {
  return demo.locator('[data-slot="block-selection-evidence"]')
}

async function editWithHistory(page: Page, demo: Locator, editor: Locator) {
  const before = (await editor.textContent()) ?? ""
  const paragraph = editor.locator(":scope > p").last()
  await paragraph.click()
  await page.keyboard.press("ControlOrMeta+End")
  await expect
    .poll(() =>
      paragraph.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        if (
          !selection?.isCollapsed ||
          !selection.anchorNode ||
          !element.contains(selection.anchorNode)
        )
          return false
        const remaining = element.ownerDocument.createRange()
        remaining.selectNodeContents(element)
        remaining.setStart(selection.anchorNode, selection.anchorOffset)

        return remaining.toString() === ""
      }),
    )
    .toBe(true)
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-selection",
    "range",
  )
  await page.keyboard.press("Enter")
  await page.keyboard.type("After Escape")
  await expect.poll(() => editor.textContent()).toBe(`${before}After Escape`)
  await demo.getByRole("button", { name: "Undo", exact: true }).click()
  await expect.poll(() => editor.textContent()).toBe(before)
  await demo.getByRole("button", { name: "Redo", exact: true }).click()
  await expect.poll(() => editor.textContent()).toBe(`${before}After Escape`)
  await editor.click()
  await expect(editor).toBeFocused()
}

test("trusted composing Escape stays native and later editing keeps history", async ({
  page,
  context,
}, testInfo) => {
  const { demo, editor } = await openSelection(page)
  await editor.click()
  await page.keyboard.press("ControlOrMeta+End")
  const before = (await editor.textContent()) ?? ""
  await observeKeys(demo)
  const session = await context.newCDPSession(page)

  try {
    await session.send("Input.imeSetComposition", {
      text: "に",
      selectionStart: 1,
      selectionEnd: 1,
    })
    await saveEvidence(demo, testInfo)
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-composing",
      "true",
    )
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-text",
      `${before}に`,
    )
    await expect.poll(() => editor.textContent()).toBe(`${before}に\u200b`)
    await session.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    })
    await expect
      .poll(() => readKeys(demo))
      .toEqual([
        {
          key: "Escape",
          keyCode: 27,
          composing: true,
          trusted: true,
          prevented: false,
        },
      ])
    await saveEvidence(demo, testInfo)
    await expect(editor).toBeFocused()
    await expect(demo.getByRole("status")).toContainText("0 blocks selected")
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-composing",
      "true",
    )
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-text",
      `${before}に`,
    )
    await expect.poll(() => editor.textContent()).toBe(`${before}に\u200b`)
    await session.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    })
    await session.send("Input.insertText", { text: "に" })
    await saveEvidence(demo, testInfo)
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-composing",
      "false",
    )
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-text",
      `${before}に`,
    )
    await expect.poll(() => editor.textContent()).toBe(`${before}に`)
    await expect(demo.getByRole("textbox")).toHaveCount(1)
    await demo.getByRole("button", { name: "Undo", exact: true }).click()
    await expect.poll(() => editor.textContent()).toBe(before)
    await demo.getByRole("button", { name: "Redo", exact: true }).click()
    await expect.poll(() => editor.textContent()).toBe(`${before}に`)
  } finally {
    await session.detach()
  }

  await editWithHistory(page, demo, editor)
  await saveEvidence(demo, testInfo)
})

for (const key of [
  { key: "Escape", code: "Escape", modifiers: 0 },
  { key: "ArrowDown", code: "ArrowDown", modifiers: 0 },
  { key: "a", code: "KeyA", modifiers: 2 },
]) {
  test(`trusted code 229 ${key.key} leaves owned selection unchanged`, async ({
    page,
    context,
  }, testInfo) => {
    const { demo, editor, selects } = await openSelection(page)
    const before = await editor.textContent()
    await selects.first().click()
    await observeKeys(demo)
    const session = await context.newCDPSession(page)

    try {
      await session.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        ...key,
        windowsVirtualKeyCode: 229,
      })
      await expect
        .poll(() => readKeys(demo))
        .toEqual([
          {
            key: key.key,
            keyCode: 229,
            composing: false,
            trusted: true,
            prevented: false,
          },
        ])
      await expect(selects.first()).toHaveAttribute("aria-pressed", "true")
      await expect(selects.nth(1)).toHaveAttribute("aria-pressed", "false")
      await expect(selects.nth(2)).toHaveAttribute("aria-pressed", "false")
      await expect(selects.first()).toBeFocused()
      await expect.poll(() => editor.textContent()).toBe(before)
      await session.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        ...key,
        windowsVirtualKeyCode: 229,
      })
    } finally {
      await session.detach()
    }

    await page.keyboard.press("Escape")
    await expect(demo.getByRole("status")).toContainText("0 blocks selected")
    await expect(selects.first()).toBeFocused()
    await editWithHistory(page, demo, editor)
    await saveEvidence(demo, testInfo)
  })
}

test("ordinary Escape without owned selection stays uncancelled in content and gutter", async ({
  page,
}, testInfo) => {
  const { demo, editor, selects } = await openSelection(page)
  await editor.click()
  await expect(editor).toBeFocused()
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-selection",
    "range",
  )
  const before = await nativeEvidence(demo).getAttribute("data-native-document")
  const beforeText = await editor.textContent()
  await observeKeys(demo)
  await page.keyboard.press("Escape")
  await saveEvidence(demo, testInfo)
  await expect(editor).not.toBeFocused()
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-document",
    before!,
  )
  await expect.poll(() => editor.textContent()).toBe(beforeText)
  await expect(
    demo.locator('button[aria-pressed="true"][aria-label^="Select block "]'),
  ).toHaveCount(0)
  await expect(demo.getByRole("status")).toContainText("0 blocks selected")
  await selects.first().focus()
  await page.keyboard.press("Escape")
  await expect(selects.first()).toBeFocused()
  await expect
    .poll(() => readKeys(demo))
    .toEqual([
      {
        key: "Escape",
        keyCode: 27,
        composing: false,
        trusted: true,
        prevented: false,
      },
      {
        key: "Escape",
        keyCode: 27,
        composing: false,
        trusted: true,
        prevented: false,
      },
    ])
  await expect(demo.getByRole("status")).toContainText("0 blocks selected")
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-document",
    before!,
  )
  await expect.poll(() => editor.textContent()).toBe(beforeText)
  await editWithHistory(page, demo, editor)
  await saveEvidence(demo, testInfo)
})

for (const readOnly of [false, true]) {
  test(`owned Escape clears selection and retains usable focus with readonly=${readOnly}`, async ({
    page,
  }, testInfo) => {
    const { demo, editor, selects } = await openSelection(page)

    const readOnlyButton = page.getByRole("button", {
      name: "Read only",
      exact: true,
    })

    const before = await editor.textContent()

    if (readOnly) {
      await readOnlyButton.click()
      await expect(editor).toHaveAttribute("contenteditable", "false")
    }

    await selects.first().click()
    await selects.last().click({ modifiers: ["Shift"] })
    await expect(demo.getByRole("status")).toContainText("3 blocks selected")
    await observeKeys(demo)
    await page.keyboard.press("Escape")
    await expect
      .poll(() => readKeys(demo))
      .toEqual([
        {
          key: "Escape",
          keyCode: 27,
          composing: false,
          trusted: true,
          prevented: true,
        },
      ])
    await expect(demo.getByRole("status")).toContainText("0 blocks selected")
    await expect(selects.last()).toBeFocused()
    await expect.poll(() => editor.textContent()).toBe(before)

    if (readOnly) {
      await expect(
        demo.getByRole("button", { name: "Delete blocks", exact: true }),
      ).toBeDisabled()
      await readOnlyButton.click()
      await expect(editor).toHaveAttribute("contenteditable", "true")
    }

    await editWithHistory(page, demo, editor)
    await saveEvidence(demo, testInfo)
  })
}

for (const policy of ["Cancel keyboard default", "Cancel Base UI handler"]) {
  test(`${policy} vetoes owned Escape before wrapper actions`, async ({
    page,
  }, testInfo) => {
    const { demo, editor, selects } = await openSelection(page)
    const policyButton = page.getByRole("button", { name: policy, exact: true })
    await policyButton.click()
    await selects.nth(1).click()
    const before = await editor.textContent()
    await observeKeys(demo)
    await page.keyboard.press("Escape")
    await expect
      .poll(() => readKeys(demo))
      .toEqual([
        {
          key: "Escape",
          keyCode: 27,
          composing: false,
          trusted: true,
          prevented: policy === "Cancel keyboard default",
        },
      ])
    await expect(selects.nth(1)).toHaveAttribute("aria-pressed", "true")
    await expect(selects.nth(1)).toBeFocused()
    await expect.poll(() => editor.textContent()).toBe(before)
    await policyButton.click()
    await selects.nth(1).focus()
    await page.keyboard.press("Escape")
    await expect(demo.getByRole("status")).toContainText("0 blocks selected")
    await expect(selects.nth(1)).toBeFocused()
    await editWithHistory(page, demo, editor)
    await saveEvidence(demo, testInfo)
  })
}

async function startOperation(
  page: Page,
  demo: Locator,
  operation: "drag" | "marquee",
) {
  const content = demo.locator('[data-slot="editor-content"]')
  const block = await content.locator(":scope > *").first().boundingBox()

  const gutter =
    operation === "marquee"
      ? await demo
          .locator('[data-slot="editor-block-selection-gutter"]')
          .boundingBox()
      : null

  const handle = await demo
    .getByRole("button", { name: "Drag block 1", exact: true })
    .boundingBox()

  if (!block || !handle || (operation === "marquee" && !gutter))
    throw new Error("Missing block pointer geometry")

  const x = gutter ? gutter.x + gutter.width / 2 : handle.x + handle.width / 2
  const y = operation === "drag" ? handle.y + handle.height / 2 : block.y - 4
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, block.y + block.height / 2, {
    steps: operation === "marquee" ? 5 : 1,
  })
  await expect(
    demo.getByRole("button", { name: "Select block 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")

  if (operation === "drag")
    await expect(demo.getByRole("status")).toContainText("dragging")

  return { x, y: block.y + block.height / 2 }
}

for (const operation of ["drag", "marquee"] as const) {
  for (const composing of [true, false]) {
    test(`active ${operation} ignores trusted ${composing ? "composing Escape" : "code 229"}`, async ({
      page,
      context,
    }, testInfo) => {
      const { demo, editor, selects } = await openSelection(page)
      const session = await context.newCDPSession(page)
      await editor.click()
      await page.keyboard.press("ControlOrMeta+End")
      const before = (await editor.textContent()) ?? ""

      try {
        if (composing) {
          await session.send("Input.imeSetComposition", {
            text: "に",
            selectionStart: 1,
            selectionEnd: 1,
          })
          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-native-composing",
            "true",
          )
          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-native-text",
            `${before}に`,
          )
        } else {
          await selects.first().focus()
        }

        const point = await startOperation(page, demo, operation)
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-composing",
          String(composing),
        )
        await observeKeys(demo)

        const document = await nativeEvidence(demo).getAttribute(
          "data-native-document",
        )

        const selected = await nativeEvidence(demo).getAttribute(
          "data-block-snapshot",
        )

        await saveEvidence(demo, testInfo)
        await session.send("Input.dispatchKeyEvent", {
          type: "keyDown",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: composing ? 27 : 229,
        })
        await expect
          .poll(() => readKeys(demo))
          .toEqual([
            {
              key: "Escape",
              keyCode: composing ? 27 : 229,
              composing,
              trusted: true,
              prevented: false,
            },
          ])
        await saveEvidence(demo, testInfo)
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-block-snapshot",
          selected!,
        )
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-document",
          document!,
        )
        await session.send("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: composing ? 27 : 229,
        })

        if (composing) {
          await page.mouse.up()
          await session.send("Input.insertText", { text: "に" })
          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-native-composing",
            "false",
          )
          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-native-text",
            `${before}に`,
          )
          await expect.poll(() => editor.textContent()).toBe(`${before}に`)
        } else {
          await page.mouse.move(point.x, point.y + 1)
          await expect(selects.first()).toHaveAttribute("aria-pressed", "true")
          await page.keyboard.press("Escape")
          await expect(demo.getByRole("status")).toContainText(
            "0 blocks selected",
          )
          await page.mouse.move(point.x, point.y + 2)
          await expect(demo.getByRole("status")).toContainText(
            "0 blocks selected",
          )
          await page.mouse.up()
          await expect.poll(() => editor.textContent()).toBe(before)
        }

        await editWithHistory(page, demo, editor)
      } finally {
        try {
          await saveEvidence(demo, testInfo)
        } finally {
          await page.mouse.up()
          await session.detach()
        }
      }
    })
  }

  for (const policy of [
    "none",
    "earlier native",
    "Cancel keyboard default",
    "Cancel Base UI handler",
  ]) {
    test(`active ${operation} ordinary Escape with ${policy} policy`, async ({
      page,
    }, testInfo) => {
      const { demo, editor, selects } = await openSelection(page)

      if (policy.startsWith("Cancel"))
        await demo.getByRole("button", { name: policy, exact: true }).click()
      await selects.first().focus()

      const veto = await demo.evaluateHandle((element, enabled) => {
        const abort = new AbortController()

        if (enabled)
          element.ownerDocument.addEventListener(
            "keydown",
            (event) => {
              if (event.key === "Escape") event.preventDefault()
            },
            { capture: true, signal: abort.signal },
          )

        return abort
      }, policy === "earlier native")

      try {
        const document = await nativeEvidence(demo).getAttribute(
          "data-native-document",
        )

        const point = await startOperation(page, demo, operation)

        const selected = await nativeEvidence(demo).getAttribute(
          "data-block-snapshot",
        )

        await observeKeys(demo)
        await saveEvidence(demo, testInfo)
        await page.keyboard.press("Escape")
        await expect
          .poll(() => readKeys(demo))
          .toEqual([
            {
              key: "Escape",
              keyCode: 27,
              composing: false,
              trusted: true,
              prevented: policy !== "Cancel Base UI handler",
            },
          ])
        await saveEvidence(demo, testInfo)
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-document",
          document!,
        )

        if (policy === "none") {
          await expect(demo.getByRole("status")).toContainText(
            "0 blocks selected",
          )
          await page.mouse.move(point.x, point.y + 2)
          await expect(demo.getByRole("status")).toContainText(
            "0 blocks selected",
          )
        } else {
          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-block-snapshot",
            selected!,
          )
          await page.mouse.move(point.x, point.y + 1)
          await expect(selects.first()).toHaveAttribute("aria-pressed", "true")
        }

        await page.mouse.up()
        await veto.evaluate((abort) => abort.abort())

        if (policy.startsWith("Cancel"))
          await demo.getByRole("button", { name: policy, exact: true }).click()
        await selects.first().focus()
        await page.keyboard.press("Escape")
        await expect(demo.getByRole("status")).toContainText(
          "0 blocks selected",
        )
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-document",
          document!,
        )
        await editWithHistory(page, demo, editor)
      } finally {
        try {
          await saveEvidence(demo, testInfo)
        } finally {
          await page.mouse.up()
          await veto.evaluate((abort) => abort.abort())
          await veto.dispose()
        }
      }
    })
  }
}

for (const policy of [
  "none",
  "earlier native",
  "Cancel keyboard default",
  "Cancel Base UI handler",
] as const) {
  test(`moving drag respects ${policy} and releases pointer capture`, async ({
    page,
  }, testInfo) => {
    const { demo, editor } = await openSelection(page)

    const handle = demo.getByRole("button", {
      name: "Drag block 1",
      exact: true,
    })

    if (policy.startsWith("Cancel"))
      await demo.getByRole("button", { name: policy, exact: true }).click()

    await demo
      .getByRole("button", { name: "Select block 1", exact: true })
      .click()
    await page.keyboard.press("Tab")
    await expect(handle).toBeFocused()
    const target = await editor.locator(":scope > *").last().boundingBox()
    const start = await handle.boundingBox()
    const pointerOwner = await handle.elementHandle()

    if (!start || !target || !pointerOwner)
      throw new Error("Missing drag pointer geometry")

    await observeKeys(demo)

    const veto = await demo.evaluateHandle((element, enabled) => {
      const abort = new AbortController()

      if (enabled)
        element.ownerDocument.addEventListener(
          "keydown",
          (event) => {
            if (event.key === "Escape") event.preventDefault()
          },
          { capture: true, signal: abort.signal },
        )

      return abort
    }, policy === "earlier native")

    await pointerOwner.evaluate((element) => {
      const events: {
        type: string
        pointerId: number
        x: number
        y: number
        trusted: boolean
        captured: boolean
      }[] = []

      element.setAttribute("data-test-pointer-events", "[]")

      for (const type of [
        "pointerdown",
        "gotpointercapture",
        "pointermove",
        "pointerup",
        "lostpointercapture",
      ])
        element.addEventListener(type, (event) => {
          if (!(event instanceof PointerEvent)) return

          const pointer = event

          events.push({
            type: pointer.type,
            pointerId: pointer.pointerId,
            x: pointer.clientX,
            y: pointer.clientY,
            trusted: pointer.isTrusted,
            captured: element.hasPointerCapture(pointer.pointerId),
          })

          element.setAttribute(
            "data-test-pointer-events",
            JSON.stringify(events),
          )
        })
    })

    const document = await nativeEvidence(demo).getAttribute(
      "data-native-document",
    )

    const before = await editor.textContent()
    const x = start.x + start.width / 2
    const y = start.y + start.height / 2
    const targetY = target.y + target.height - 2

    expect(Math.abs(targetY - y)).toBeGreaterThan(6)

    try {
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x, targetY)
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-block-snapshot",
        /"dropTarget":\{"key":"[^"]+","edge":"after"\}/,
      )

      const snapshot = await nativeEvidence(demo).getAttribute(
        "data-block-snapshot",
      )

      await expect
        .poll(() =>
          pointerOwner.evaluate((element) => {
            const events: {
              type: string
              pointerId: number
              x: number
              y: number
              trusted: boolean
              captured: boolean
            }[] = JSON.parse(
              element.getAttribute("data-test-pointer-events") ?? "[]",
            )

            const down = events.find((event) => event.type === "pointerdown")

            const capture = events.find(
              (event) => event.type === "gotpointercapture",
            )

            const move = events.find(
              (event) =>
                event.type === "pointermove" &&
                down &&
                Math.hypot(event.x - down.x, event.y - down.y) > 6,
            )

            return Boolean(
              down?.trusted &&
              capture?.trusted &&
              capture.captured &&
              move?.trusted &&
              move.captured &&
              down.pointerId === capture.pointerId &&
              down.pointerId === move.pointerId &&
              element.hasPointerCapture(down.pointerId),
            )
          }),
        )
        .toBe(true)
      await saveEvidence(demo, testInfo)
      await page.keyboard.press("Escape")
      await expect
        .poll(() => readKeys(demo))
        .toEqual([
          {
            key: "Escape",
            keyCode: 27,
            composing: false,
            trusted: true,
            prevented: policy !== "Cancel Base UI handler",
          },
        ])
      await saveEvidence(demo, testInfo)
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-document",
        document!,
      )

      if (policy === "none") {
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-selected",
          "[]",
        )
        await page.mouse.move(x, targetY + 1)
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-block-snapshot",
          /"mode":false,"dragging":false/,
        )
      } else {
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-block-snapshot",
          snapshot!,
        )
      }

      await page.mouse.up()
      await page.mouse.move(x, targetY + 2)
      await expect
        .poll(() =>
          pointerOwner.evaluate((element) => {
            const events: {
              type: string
              pointerId: number
              trusted: boolean
              captured: boolean
            }[] = JSON.parse(
              element.getAttribute("data-test-pointer-events") ?? "[]",
            )

            const down = events.find((event) => event.type === "pointerdown")
            const up = events.find((event) => event.type === "pointerup")

            const lost = events.find(
              (event) => event.type === "lostpointercapture",
            )

            return Boolean(
              down &&
              up?.trusted &&
              lost?.trusted &&
              up.pointerId === down.pointerId &&
              lost.pointerId === down.pointerId &&
              !lost.captured &&
              !element.hasPointerCapture(down.pointerId),
            )
          }),
        )
        .toBe(true)
      await expect
        .poll(() =>
          pointerOwner.evaluate(
            (element) => element.ownerDocument.activeElement === element,
          ),
        )
        .toBe(true)
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-block-snapshot",
        /"dragging":false/,
      )
      await saveEvidence(demo, testInfo)

      if (policy === "none") {
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-document",
          document!,
        )
        await expect.poll(() => editor.textContent()).toBe(before)
      } else {
        await expect
          .poll(() => editor.textContent())
          .toBe("Second blockThird blockFirst block")
        await demo.getByRole("button", { name: "Undo", exact: true }).click()
        await expect(nativeEvidence(demo)).toHaveAttribute(
          "data-native-document",
          document!,
        )
        await demo.getByRole("button", { name: "Redo", exact: true }).click()
        await expect
          .poll(() => editor.textContent())
          .toBe("Second blockThird blockFirst block")
      }

      await editWithHistory(page, demo, editor)
    } finally {
      try {
        await saveEvidence(demo, testInfo)
      } finally {
        try {
          await page.mouse.up()
          await testInfo.attach("block-selection-pointer.json", {
            body:
              (await pointerOwner.getAttribute("data-test-pointer-events")) ??
              "[]",
            contentType: "application/json",
          })
        } finally {
          await veto.evaluate((abort) => abort.abort())
          await veto.dispose()
        }
      }
    }
  })
}

test("moving drag restores handle focus on release from another control", async ({
  page,
}, testInfo) => {
  const { demo, editor } = await openSelection(page)

  const other = demo.getByRole("button", {
    name: "Select first block",
    exact: true,
  })

  const handle = demo.getByRole("button", {
    name: "Drag block 1",
    exact: true,
  })

  await other.click()
  await expect(other).toBeFocused()

  const target = await editor.locator(":scope > *").last().boundingBox()
  const start = await handle.boundingBox()
  const pointerOwner = await handle.elementHandle()

  if (!start || !target || !pointerOwner)
    throw new Error("Missing drag pointer geometry")

  const document = await nativeEvidence(demo).getAttribute(
    "data-native-document",
  )

  const x = start.x + start.width / 2
  const y = start.y + start.height / 2
  const targetY = target.y + target.height - 2

  expect(Math.abs(targetY - y)).toBeGreaterThan(6)

  await pointerOwner.evaluate((element) => {
    const events: { type: string; pointerId: number; trusted: boolean }[] = []
    element.setAttribute("data-test-release-events", "[]")

    for (const type of ["pointerdown", "pointerup", "lostpointercapture"])
      element.addEventListener(type, (event) => {
        if (!(event instanceof PointerEvent)) return
        events.push({
          type: event.type,
          pointerId: event.pointerId,
          trusted: event.isTrusted,
        })
        element.setAttribute("data-test-release-events", JSON.stringify(events))
      })
  })

  try {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, targetY)
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-block-snapshot",
      /"dropTarget":\{"key":"[^"]+","edge":"after"\}/,
    )
    await expect(other).toBeFocused()
    await page.mouse.up()
    await page.mouse.move(x, targetY + 1)
    await expect
      .poll(() =>
        pointerOwner.evaluate((element) => {
          const events: {
            type: string
            pointerId: number
            trusted: boolean
          }[] = JSON.parse(
            element.getAttribute("data-test-release-events") ?? "[]",
          )

          const down = events.find((event) => event.type === "pointerdown")
          const up = events.find((event) => event.type === "pointerup")

          const lost = events.find(
            (event) => event.type === "lostpointercapture",
          )

          return Boolean(
            down?.trusted &&
            up?.trusted &&
            lost?.trusted &&
            up.pointerId === down.pointerId &&
            lost.pointerId === down.pointerId &&
            !element.hasPointerCapture(down.pointerId) &&
            element.ownerDocument.activeElement === element,
          )
        }),
      )
      .toBe(true)
    await saveEvidence(demo, testInfo)
    await expect
      .poll(() => editor.textContent())
      .toBe("Second blockThird blockFirst block")
    await demo.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-document",
      document!,
    )
    await demo.getByRole("button", { name: "Redo", exact: true }).click()
    await expect
      .poll(() => editor.textContent())
      .toBe("Second blockThird blockFirst block")
  } finally {
    await page.mouse.up()
    await testInfo.attach("block-selection-focus-release.json", {
      body:
        (await pointerOwner.getAttribute("data-test-release-events")) ?? "[]",
      contentType: "application/json",
    })
  }
})

test("trusted native-content code 229 preserves an owned NodeSelection", async ({
  page,
  context,
}, testInfo) => {
  const { demo, editor, selects } = await openSelection(page)
  await selects.first().click()
  await editor.focus()
  await expect(editor).toBeFocused()
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-selection",
    "node",
  )

  const document = await nativeEvidence(demo).getAttribute(
    "data-native-document",
  )

  await observeKeys(demo)
  const session = await context.newCDPSession(page)

  try {
    await saveEvidence(demo, testInfo)
    await session.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 229,
    })
    await expect
      .poll(() => readKeys(demo))
      .toEqual([
        {
          key: "Escape",
          keyCode: 229,
          composing: false,
          trusted: true,
          prevented: false,
        },
      ])
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-selection",
      "node",
    )
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-document",
      document!,
    )
    await expect(selects.first()).toHaveAttribute("aria-pressed", "true")
    await expect(editor).toBeFocused()
    await session.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 229,
    })
    await page.keyboard.press("Escape")
    await expect(demo.getByRole("status")).toContainText("0 blocks selected")
    await editWithHistory(page, demo, editor)
  } finally {
    try {
      await saveEvidence(demo, testInfo)
    } finally {
      await session.detach()
    }
  }
})

const wrapperTopologies = [
  "normal",
  "gutter-free",
  "portalled-content",
  "portalled-handle",
] as const

type Topology = (typeof wrapperTopologies)[number] | "standalone"

async function openTopology(page: Page, topology: Topology) {
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="block-selection-preview"]').first()

  const editor = demo.getByRole("textbox", {
    name: "Block selection editor",
    exact: true,
  })

  const select = demo.getByRole("button", {
    name: "Select first block",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(select).toBeEnabled()

  const composition = demo.getByRole("button", {
    name: `Composition ${topology}`,
    exact: true,
  })

  await composition.click()
  await expect(composition).toHaveAttribute("aria-pressed", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(select).toBeEnabled()
  const wrapper = demo.locator('[data-slot="editor-block-selection"]')

  if (topology === "standalone") await expect(wrapper).toHaveCount(0)
  else {
    await expect(wrapper).toHaveCount(1)
    await expect(
      wrapper.getByRole("textbox", {
        name: "Block selection editor",
        exact: true,
      }),
    ).toHaveCount(topology === "portalled-content" ? 0 : 1)

    if (topology === "gutter-free")
      await expect(
        demo.locator('[data-slot="editor-block-selection-gutter"]'),
      ).toHaveCount(0)

    if (topology === "portalled-handle")
      await expect(
        wrapper.getByRole("button", {
          name: "Custom drag block 1",
          exact: true,
        }),
      ).toHaveCount(0)
  }

  return { demo, editor, select }
}

async function selectNative(editor: Locator, select: Locator, demo: Locator) {
  await select.click()
  await editor.focus()
  await expect(editor).toBeFocused()
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-selection",
    "node",
  )
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-native-selected",
    /"[^"\]]+"/,
  )
}

for (const topology of [...wrapperTopologies, "standalone"] as const) {
  test(`${topology}: owned native Escape ignores composing and code229, then clears once`, async ({
    page,
    context,
  }, testInfo) => {
    const { demo, editor, select } = await openTopology(page, topology)
    await selectNative(editor, select, demo)

    const document = await nativeEvidence(demo).getAttribute(
      "data-native-document",
    )

    const selected = await nativeEvidence(demo).getAttribute(
      "data-native-selected",
    )

    const snapshot = await nativeEvidence(demo).getAttribute(
      "data-block-snapshot",
    )

    await expect(
      demo.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled()
    await observeKeys(demo)
    await editor.dispatchEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      isComposing: true,
    })
    const session = await context.newCDPSession(page)

    try {
      await session.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 229,
      })
      await session.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 229,
      })
      await expect
        .poll(() => readKeys(demo))
        .toEqual([
          {
            key: "Escape",
            keyCode: 27,
            composing: true,
            trusted: false,
            prevented: false,
          },
          {
            key: "Escape",
            keyCode: 229,
            composing: false,
            trusted: true,
            prevented: false,
          },
        ])
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selected",
        selected!,
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-block-snapshot",
        snapshot!,
      )
      await page.keyboard.press("Escape")
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selection",
        "none",
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selected",
        "[]",
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-document",
        document!,
      )
      await expect(editor).toBeFocused()
      await expect
        .poll(() => readKeys(demo))
        .toEqual([
          {
            key: "Escape",
            keyCode: 27,
            composing: true,
            trusted: false,
            prevented: false,
          },
          {
            key: "Escape",
            keyCode: 229,
            composing: false,
            trusted: true,
            prevented: false,
          },
          {
            key: "Escape",
            keyCode: 27,
            composing: false,
            trusted: true,
            prevented: true,
          },
        ])
      await expect(
        demo.getByRole("button", { name: "Undo", exact: true }),
      ).toBeDisabled()
      await saveEvidence(demo, testInfo)
      await editWithHistory(page, demo, editor)
    } finally {
      await session.detach()
    }
  })
}

for (const topology of wrapperTopologies) {
  for (const policy of ["Cancel keyboard default", "Cancel Base UI handler"]) {
    test(`${topology}: native owned Escape reaches ${policy} before cancellation`, async ({
      page,
    }, testInfo) => {
      const { demo, editor, select } = await openTopology(page, topology)

      const policyButton = demo.getByRole("button", {
        name: policy,
        exact: true,
      })

      await policyButton.click()
      await selectNative(editor, select, demo)

      const document = await nativeEvidence(demo).getAttribute(
        "data-native-document",
      )

      const selected = await nativeEvidence(demo).getAttribute(
        "data-native-selected",
      )

      const snapshot = await nativeEvidence(demo).getAttribute(
        "data-block-snapshot",
      )

      await observeKeys(demo)
      await page.keyboard.press("Escape")
      await expect
        .poll(() => readKeys(demo))
        .toEqual([
          {
            key: "Escape",
            keyCode: 27,
            composing: false,
            trusted: true,
            prevented: policy === "Cancel keyboard default",
          },
        ])
      await expect(demo).toHaveAttribute("data-wrapper-escape-count", "1")
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selection",
        "node",
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selected",
        selected!,
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-block-snapshot",
        snapshot!,
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-document",
        document!,
      )
      await expect(editor).toBeFocused()
      await saveEvidence(demo, testInfo)
      await policyButton.click()
      await editor.focus()
      await page.keyboard.press("Escape")
      await expect(demo).toHaveAttribute("data-wrapper-escape-count", "2")
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selection",
        "none",
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-document",
        document!,
      )
      await editWithHistory(page, demo, editor)
    })
  }
}

async function startCustomDrag(page: Page, handle: Locator, demo: Locator) {
  const rect = await handle.boundingBox()

  if (!rect) throw new Error("Missing custom handle geometry")
  const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await expect(nativeEvidence(demo)).toHaveAttribute(
    "data-block-snapshot",
    /"dragging":true/,
  )

  return point
}

for (const topology of [
  "gutter-free",
  "portalled-content",
  "portalled-handle",
] as const) {
  for (const operation of ["drag", "marquee"] as const) {
    if (
      (topology === "gutter-free" || topology === "portalled-content") &&
      operation === "marquee"
    )
      continue

    for (const policy of [
      "none",
      "Cancel keyboard default",
      "Cancel Base UI handler",
    ]) {
      test(`${topology}: held ${operation} respects ${policy} without fallback replay`, async ({
        page,
        context,
      }, testInfo) => {
        const { demo, editor, select } = await openTopology(page, topology)

        if (policy !== "none")
          await demo.getByRole("button", { name: policy, exact: true }).click()
        await selectNative(editor, select, demo)

        const handle = demo.getByRole("button", {
          name: "Custom drag block 1",
          exact: true,
        })

        if (topology !== "portalled-content") await handle.focus()

        const document = await nativeEvidence(demo).getAttribute(
          "data-native-document",
        )

        const session = await context.newCDPSession(page)

        try {
          const point =
            operation === "marquee"
              ? await startOperation(page, demo, operation)
              : await startCustomDrag(page, handle, demo)

          if (topology === "portalled-content") await editor.focus()
          else await expect(handle).toBeFocused()

          const snapshot = await nativeEvidence(demo).getAttribute(
            "data-block-snapshot",
          )

          const selected = await nativeEvidence(demo).getAttribute(
            "data-native-selected",
          )

          await observeKeys(demo)
          const target = topology === "portalled-content" ? editor : handle
          await target.dispatchEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            isComposing: true,
          })
          await session.send("Input.dispatchKeyEvent", {
            type: "keyDown",
            key: "Escape",
            code: "Escape",
            windowsVirtualKeyCode: 229,
          })
          await session.send("Input.dispatchKeyEvent", {
            type: "keyUp",
            key: "Escape",
            code: "Escape",
            windowsVirtualKeyCode: 229,
          })
          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-block-snapshot",
            snapshot!,
          )
          await page.keyboard.press("Escape")
          await expect
            .poll(() => readKeys(demo))
            .toEqual([
              {
                key: "Escape",
                keyCode: 27,
                composing: true,
                trusted: false,
                prevented: policy === "Cancel keyboard default",
              },
              {
                key: "Escape",
                keyCode: 229,
                composing: false,
                trusted: true,
                prevented: policy === "Cancel keyboard default",
              },
              {
                key: "Escape",
                keyCode: 27,
                composing: false,
                trusted: true,
                prevented: policy !== "Cancel Base UI handler",
              },
            ])
          await expect(demo).toHaveAttribute("data-wrapper-escape-count", "3")

          if (policy === "none") {
            await expect(nativeEvidence(demo)).toHaveAttribute(
              "data-native-selected",
              "[]",
            )
            await page.mouse.move(point.x, point.y + 2)
            await expect(nativeEvidence(demo)).toHaveAttribute(
              "data-block-snapshot",
              /"mode":false,"dragging":false/,
            )
          } else {
            await expect(nativeEvidence(demo)).toHaveAttribute(
              "data-block-snapshot",
              snapshot!,
            )
            await expect(nativeEvidence(demo)).toHaveAttribute(
              "data-native-selected",
              selected!,
            )
          }

          await expect(nativeEvidence(demo)).toHaveAttribute(
            "data-native-document",
            document!,
          )
          await saveEvidence(demo, testInfo)
          await page.mouse.up()

          if (policy !== "none")
            await demo
              .getByRole("button", { name: policy, exact: true })
              .click()
          await editor.focus()
          await page.keyboard.press("Escape")
          await editWithHistory(page, demo, editor)
        } finally {
          try {
            await saveEvidence(demo, testInfo)
          } finally {
            await page.mouse.up()
            await session.detach()
          }
        }
      })
    }
  }
}

test("wrapper detach restores native standalone handling and reattach restores host veto", async ({
  page,
}, testInfo) => {
  const { demo } = await openTopology(page, "gutter-free")

  for (const topology of ["standalone", "gutter-free"] as const) {
    await demo
      .getByRole("button", { name: `Composition ${topology}`, exact: true })
      .click()

    const editor = demo.getByRole("textbox", {
      name: "Block selection editor",
      exact: true,
    })

    await demo
      .getByRole("button", { name: "Cancel Base UI handler", exact: true })
      .click()
    await selectNative(
      editor,
      demo.getByRole("button", { name: "Select first block", exact: true }),
      demo,
    )
    await page.keyboard.press("Escape")
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-selection",
      topology === "standalone" ? "none" : "node",
    )
    await saveEvidence(demo, testInfo)
    await demo
      .getByRole("button", { name: "Cancel Base UI handler", exact: true })
      .click()
  }
})

for (const topology of [
  "gutter-free",
  "portalled-content",
  "portalled-handle",
  "standalone",
] as const) {
  test(`${topology}: unowned native range Escape keeps native blur`, async ({
    page,
  }, testInfo) => {
    const { demo, editor } = await openTopology(page, topology)
    await editor.click()
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-selection",
      "range",
    )

    const document = await nativeEvidence(demo).getAttribute(
      "data-native-document",
    )

    await observeKeys(demo)
    await page.keyboard.press("Escape")
    await expect(editor).not.toBeFocused()
    await expect
      .poll(() => readKeys(demo))
      .toEqual([
        {
          key: "Escape",
          keyCode: 27,
          composing: false,
          trusted: true,
          prevented: false,
        },
      ])
    await expect(nativeEvidence(demo)).toHaveAttribute(
      "data-native-document",
      document!,
    )
    await saveEvidence(demo, testInfo)
    await editWithHistory(page, demo, editor)
  })
}

for (const operation of ["drag", "marquee"] as const) {
  test(`outside wrapper held ${operation} keeps document Escape fallback`, async ({
    page,
  }, testInfo) => {
    const { demo, editor, select } = await openTopology(page, "normal")
    await selectNative(editor, select, demo)

    const document = await nativeEvidence(demo).getAttribute(
      "data-native-document",
    )

    try {
      const point = await startOperation(page, demo, operation)

      const outside = demo.getByRole("button", {
        name: "Composition normal",
        exact: true,
      })

      await outside.focus()
      await expect(outside).toBeFocused()
      await observeKeys(demo)
      await page.keyboard.press("Escape")
      await expect
        .poll(() => readKeys(demo))
        .toEqual([
          {
            key: "Escape",
            keyCode: 27,
            composing: false,
            trusted: true,
            prevented: true,
          },
        ])
      await expect(demo).toHaveAttribute("data-wrapper-escape-count", "0")
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-selected",
        "[]",
      )
      await page.mouse.move(point.x, point.y + 2)
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-block-snapshot",
        /"mode":false,"dragging":false/,
      )
      await expect(nativeEvidence(demo)).toHaveAttribute(
        "data-native-document",
        document!,
      )
      await saveEvidence(demo, testInfo)
    } finally {
      await page.mouse.up()
    }

    await editWithHistory(page, demo, editor)
  })
}
