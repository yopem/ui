import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"

async function saveState(page: Page, testInfo: TestInfo, name: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach(`${name}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })

  const aria = await page
    .getByRole("combobox", { includeHidden: true })
    .evaluateAll((inputs) =>
      inputs.map((input) => ({
        id: input.id,
        label: input.getAttribute("aria-label"),
        labelledBy: input.getAttribute("aria-labelledby"),
        expanded: input.getAttribute("aria-expanded"),
        controls: input.getAttribute("aria-controls"),
        activeDescendant: input.getAttribute("aria-activedescendant"),
        focused: input === document.activeElement,
        hidden: Boolean(input.closest('[aria-hidden="true"], [inert]')),
      })),
    )

  await testInfo.attach(`${name}-aria.json`, {
    body: JSON.stringify(aria, null, 2),
    contentType: "application/json",
  })
  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  })
  expect(report.violations).toEqual([])
}

async function saveActiveLayout(
  input: Locator,
  testInfo: TestInfo,
  name: string,
) {
  const activeId = await input.getAttribute("aria-activedescendant")
  expect(activeId).not.toBeNull()
  const active = input.page().locator(`[id=${JSON.stringify(activeId)}]`)
  await expect(active).toBeInViewport()

  const layout = await input.evaluate((node) => {
    const active = document.getElementById(
      node.getAttribute("aria-activedescendant") ?? "",
    )

    const list = document.getElementById(
      node.getAttribute("aria-controls") ?? "",
    )

    if (!active || !list) return null
    const a = active.getBoundingClientRect()

    const l =
      list
        .closest('[data-slot="scroll-area-viewport"]')
        ?.getBoundingClientRect() ?? list.getBoundingClientRect()

    const x = Math.max(0, Math.min(innerWidth - 1, a.x + a.width / 2))

    const y =
      Math.max(l.top, a.top) + Math.min(a.bottom - Math.max(l.top, a.top), 8)

    return {
      active: a.toJSON(),
      list: l.toJSON(),
      viewport: { width: innerWidth, height: innerHeight },
      hit: active.contains(document.elementFromPoint(x, y)),
      visible:
        a.bottom > l.top &&
        a.top < l.bottom &&
        a.right > 0 &&
        a.left < innerWidth,
    }
  })

  await testInfo.attach(`${name}-layout.json`, {
    body: JSON.stringify(layout, null, 2),
    contentType: "application/json",
  })
  expect(layout).toMatchObject({ hit: true, visible: true })
}

async function expectBackgroundOwned(page: Page, owned: boolean) {
  await expect
    .poll(() =>
      page
        .getByTestId("combobox-focus-workflows")
        .evaluate((node) =>
          Boolean(node.closest('[aria-hidden="true"], [inert]')),
        ),
    )
    .toBe(owned)
}

async function expectRelationship(input: Locator, expanded: boolean) {
  await expect(input).toHaveAttribute("aria-expanded", String(expanded))
  await expect
    .poll(() =>
      input.evaluate((element) => {
        const controls = element.getAttribute("aria-controls")
        const active = element.getAttribute("aria-activedescendant")
        const list = controls ? document.getElementById(controls) : null
        const option = active ? document.getElementById(active) : null

        const exposed = (node: Element) =>
          node.checkVisibility() &&
          !node.closest('[aria-hidden="true"], [inert]')

        return {
          list: list
            ? list.getAttribute("role") === "listbox" && exposed(list)
            : false,
          active:
            !active ||
            Boolean(
              option &&
              list?.contains(option) &&
              option.getAttribute("role") === "option" &&
              exposed(option),
            ),
        }
      }),
    )
    .toEqual({ list: expanded, active: true })
}

async function openPicker(page: Page, name = "Equipment", query = "Station 0") {
  const input = page.getByRole("combobox", { name, exact: true })
  await input.fill(query)
  await input.press("ArrowDown")
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-activedescendant", /.+/)
  await expectRelationship(input, true)

  return input
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const samples: {
      name: string
      hidden: boolean
      trusted: boolean
      ancestry: string[]
    }[] = []

    document.addEventListener(
      "focusin",
      (event) => {
        if (!(event.target instanceof Element)) return
        const ancestry: string[] = []

        for (
          let node: Element | null = event.target;
          node;
          node = node.parentElement
        ) {
          ancestry.push(
            `${node.tagName}#${node.id}[${node.getAttribute("role") ?? ""}]`,
          )
        }

        samples.push({
          name:
            event.target.getAttribute("aria-label") ??
            event.target.textContent?.slice(0, 80) ??
            "",
          hidden: Boolean(
            event.target.closest('[aria-hidden="true"], [inert]'),
          ),
          trusted: event.isTrusted,
          ancestry,
        })
        document.documentElement.setAttribute(
          "data-combobox-focus-samples",
          JSON.stringify(samples),
        )
      },
      true,
    )
  })
  await page.goto("/components/combobox")
  await expect(page.getByTestId("combobox-focus-workflows")).toBeVisible()
  await expect(page.getByTestId("equipment-ref-state")).toHaveAttribute(
    "data-ref-balance",
    "1",
  )
})

test.afterEach(async ({ page }, testInfo) => {
  const evidence = await page.evaluate(() => ({
    url: location.href,
    userAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight },
    focus:
      document.documentElement.getAttribute("data-combobox-focus-samples") ??
      "[]",
    inputs: Array.from(document.querySelectorAll('[role="combobox"]')).map(
      (input) => ({
        name: input.getAttribute("aria-label"),
        expanded: input.getAttribute("aria-expanded"),
        controls: input.getAttribute("aria-controls"),
        active: input.getAttribute("aria-activedescendant"),
      }),
    ),
  }))

  await testInfo.attach("focus-and-aria.json", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  })
  const focus: unknown = JSON.parse(evidence.focus)

  expect(focus).not.toContainEqual(expect.objectContaining({ hidden: true }))
  expect(focus).toEqual(
    expect.arrayContaining([expect.objectContaining({ trusted: true })]),
  )
})

test("equipment source copies its complete install setup", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const setupCopy = page.getByRole("button", {
    name: "Copy Equipment selection workflows setup",
    exact: true,
  })

  const setup = page.getByTestId("copyable-code").filter({ has: setupCopy })
  await setup.getByRole("button", { name: "Bun", exact: true }).click()
  await setupCopy.click()
  await expect(
    page.getByRole("button", {
      name: "Equipment selection workflows setup copied",
      exact: true,
    }),
  ).toBeVisible()
  const commands = await page.evaluate(() => navigator.clipboard.readText())
  expect(commands).toContain("@yopem-ui/cli add")
  expect(commands).toContain("@base-ui/react@^1.9.0")

  for (const item of ["combobox", "dialog", "popover", "field", "menu"])
    expect(commands.split(/\s+/)).toContain(item)
  await page
    .getByRole("button", {
      name: "Copy Equipment selection workflows source",
      exact: true,
    })
    .click()
  await expect(
    page.getByRole("button", {
      name: "Equipment selection workflows source copied",
      exact: true,
    }),
  ).toBeVisible()
  const source = await page.evaluate(() => navigator.clipboard.readText())
  expect(source).toContain('from "@/components/ui/combobox"')
  expect(source).toContain('from "@base-ui/react/dialog"')
  expect(source).not.toContain("@registry/")
  await testInfo.attach("equipment-setup.sh", {
    body: commands,
    contentType: "text/plain",
  })
  await testInfo.attach("equipment-source.tsx", {
    body: source,
    contentType: "text/plain",
  })
})

test("nonmodal keyboard, pointer and sequential focus remain native @a11y", async ({
  page,
}, testInfo) => {
  const fixture = page.getByTestId("combobox-focus-workflows")

  const before = fixture.getByRole("button", {
    name: "Before equipment",
    exact: true,
  })

  const after = fixture.getByRole("button", {
    name: "Reserve equipment",
    exact: true,
  })

  await saveState(page, testInfo, "closed")

  for (const [cycle, key] of [
    "Tab",
    "Shift+Tab",
    "Tab",
    "Shift+Tab",
  ].entries()) {
    const input = await openPicker(page)
    await expect(
      page.getByRole("option", { name: "Station 40 kit", exact: true }),
    ).toHaveCount(0)
    await saveState(page, testInfo, `open-${key}-${cycle}`)
    await input.press(key)
    await expect(key === "Tab" ? after : before).toBeFocused()
    await expectRelationship(input, false)
  }

  const input = fixture.getByRole("combobox", {
    name: "Equipment",
    exact: true,
  })

  await before.click()
  await page.keyboard.press("Tab")
  await expect(input).toBeFocused()
  await expectRelationship(input, false)
  await input.press("ArrowDown")
  await expectRelationship(input, true)
  await input.press("Escape")
  await expectRelationship(input, false)
  await input.fill("")
  await input.press("Escape")
  await input.click()
  await expectRelationship(input, true)
  await input.press("ArrowDown")
  await expect(input).toBeFocused()
  await input.press("Enter")
  await expectRelationship(input, false)
  await expect(input).not.toHaveValue("")
  await openPicker(page)
  await after.click()
  await expect(after).toHaveAttribute("data-reservations", "1")
  await expect(after).toBeFocused()
  await expectRelationship(input, false)
  await openPicker(page)
  const note = fixture.getByRole("textbox", { name: "Reservation note" })
  await note.click()
  await note.fill("Bring spare batteries")
  await expect(note).toBeFocused()
  await expectRelationship(input, false)
  await openPicker(page)
  await fixture.getByRole("link", { name: "Equipment details" }).click()
  await expect(page).toHaveURL(/#equipment-details$/)
  await expectRelationship(input, false)
  await openPicker(page)

  const other = fixture.getByRole("combobox", {
    name: "Backup equipment",
    exact: true,
  })

  await other.click()
  await expect(other).toBeFocused()
  await expectRelationship(input, false)
  await expectRelationship(other, true)
  await other.press("Escape")
  await saveState(page, testInfo, "outside-actions-complete")
})

for (const policy of ["cancel", "ignore", "defer"] as const) {
  for (const exit of [
    "Tab",
    "Shift+Tab",
    "Escape",
    "pointer",
    "action",
  ] as const) {
    test(`${policy} close through ${exit} preserves truthful open state @a11y`, async ({
      page,
    }, testInfo) => {
      const fixture = page.getByTestId("combobox-focus-workflows")
      await fixture.getByLabel("Close policy").selectOption(policy)
      const input = await openPicker(page)

      const after = fixture.getByRole("button", {
        name: "Reserve equipment",
        exact: true,
      })

      if (exit === "pointer") await after.click()
      else if (exit === "action") await input.press("F4")
      else await input.press(exit)
      await expectRelationship(input, true)

      if (exit === "Tab" || exit === "pointer")
        await expect(after).toBeFocused()

      if (exit === "Shift+Tab")
        await expect(
          fixture.getByRole("button", {
            name: "Before equipment",
            exact: true,
          }),
        ).toBeFocused()

      if (exit === "Escape" || exit === "action")
        await expect(input).toBeFocused()
      await saveState(page, testInfo, `${policy}-${exit}-open`)

      const commit = fixture.getByRole("button", {
        name: "Commit equipment close",
        exact: true,
      })

      if (policy === "defer")
        await expect(commit).toHaveAttribute("data-pending-close", "true")
      await commit.click()
      await expectRelationship(input, false)
      await expect(commit).toBeFocused()
      await saveState(page, testInfo, `${policy}-${exit}-committed`)
    })
  }
}

test("actions replacement, callback ref cleanup and concurrent root disposal @a11y", async ({
  page,
}, testInfo) => {
  const fixture = page.getByTestId("combobox-focus-workflows")
  await fixture.getByLabel("Close policy").selectOption("ignore")
  const input = await openPicker(page)
  const refs = fixture.getByTestId("equipment-ref-state")
  const attached = Number(await refs.getAttribute("data-ref-attached"))
  const cleaned = Number(await refs.getAttribute("data-ref-cleaned"))
  await fixture.getByRole("button", { name: "Replace equipment refs" }).click()
  await fixture
    .getByRole("button", { name: "Close equipment", exact: true })
    .click()
  await expect(refs).toHaveAttribute("data-ref-attached", String(attached + 1))
  await expect(refs).toHaveAttribute("data-ref-cleaned", String(cleaned + 1))
  await expect(fixture.getByTestId("equipment-ref-state")).toHaveAttribute(
    "data-old-actions-detached",
    "true",
  )
  await expect(fixture.getByTestId("equipment-ref-state")).toHaveAttribute(
    "data-ref-balance",
    "1",
  )
  await expectRelationship(input, true)
  await fixture.getByLabel("Close policy").selectOption("accept")
  await input.click()
  await input.press("F4")
  await expectRelationship(input, false)
  await expect(input).toBeFocused()
  await fixture.getByLabel("Close policy").selectOption("ignore")
  await openPicker(page)
  const other = await openPicker(page, "Backup equipment")
  expect(await input.getAttribute("aria-controls")).not.toBe(
    await other.getAttribute("aria-controls"),
  )
  await expectRelationship(input, true)
  await fixture.getByRole("button", { name: "Hide equipment picker" }).click()
  await expect(input).toHaveCount(0)
  await expectRelationship(other, true)
  await expect(fixture.getByTestId("equipment-ref-state")).toHaveAttribute(
    "data-ref-balance",
    "0",
  )
  await saveState(page, testInfo, "one-root-removed")
  await fixture.getByRole("button", { name: "Remove backup picker" }).click()
  await expect(other).toHaveCount(0)
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await saveState(page, testInfo, "both-roots-removed")
  await fixture.getByRole("button", { name: "Add backup picker" }).click()
  await fixture.getByRole("button", { name: "Show equipment picker" }).click()
  await fixture.getByLabel("Close policy").selectOption("accept")
  const remounted = await openPicker(page)
  await fixture
    .getByRole("button", { name: "Close equipment", exact: true })
    .click()
  await expectRelationship(remounted, false)
  await saveState(page, testInfo, "root-remounted")
})

test("retained close completes through current actionsRef without refocus @a11y", async ({
  page,
}, testInfo) => {
  const fixture = page.getByTestId("combobox-focus-workflows")
  await fixture.getByLabel("Close policy").selectOption("retain")
  const input = await openPicker(page)
  await input.press("Escape")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByTestId("equipment-popup")).toBeAttached()
  await saveState(page, testInfo, "retained-closing")
  await fixture.getByRole("button", { name: "Finish equipment close" }).click()
  await expect(page.getByTestId("equipment-popup")).toHaveCount(0)
  await expect(
    fixture.getByRole("button", { name: "Finish equipment close" }),
  ).toBeFocused()
  await expectRelationship(input, false)
  await saveState(page, testInfo, "retained-close-complete")
})

test("house Dialog, Popover and Menu retain layer ownership @a11y", async ({
  page,
}, testInfo) => {
  const fixture = page.getByTestId("combobox-focus-workflows")
  const trigger = fixture.getByRole("button", { name: "Plan equipment" })
  await trigger.click()

  const dialog = page.getByRole("dialog", {
    name: "Equipment plan",
    exact: true,
  })

  await expect(dialog).toBeVisible()
  const input = await openPicker(page, "Dialog equipment")
  await expect(
    fixture.getByRole("button", {
      name: "Reserve equipment",
      includeHidden: true,
      exact: true,
    }),
  ).toHaveAttribute("data-reservations", "0")
  await expectBackgroundOwned(page, true)
  await expect(dialog.getByRole("listbox")).toBeVisible()
  await saveActiveLayout(input, testInfo, "house-dialog-combo")
  await saveState(page, testInfo, "house-dialog-combo")
  await page.getByRole("button", { name: "Kit contents", exact: true }).click()

  const contents = page.getByRole("dialog", {
    name: "Kit contents",
    exact: true,
  })

  await expect(contents).toBeVisible()
  await expectBackgroundOwned(page, true)
  await saveState(page, testInfo, "combo-child-popover")
  await page.keyboard.press("Escape")
  await expect(contents).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Kit contents", exact: true }),
  ).toBeFocused()
  await expectBackgroundOwned(page, true)
  await expectRelationship(input, true)
  await input.click()
  await input.press("Escape")
  await expectRelationship(input, false)
  await expect(dialog).toBeVisible()
  await expectBackgroundOwned(page, true)
  await saveState(page, testInfo, "house-dialog-child-closed")
  await dialog.getByRole("button", { name: "Plan details" }).click()

  const popover = page.getByRole("dialog", {
    name: "Plan details",
    exact: true,
  })

  await expect(popover).toBeVisible()
  const popoverInput = await openPicker(page, "Popover equipment")
  await expectBackgroundOwned(page, true)
  await expect(popover.getByRole("listbox")).toBeVisible()
  await saveActiveLayout(popoverInput, testInfo, "house-popover-combo")
  await saveState(page, testInfo, "house-popover-combo")
  await popoverInput.press("Escape")
  await expect(popover).toBeVisible()
  await popover.getByRole("button", { name: "Plan actions" }).click()
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expectBackgroundOwned(page, true)
  await saveState(page, testInfo, "house-menu")
  await page.keyboard.press("Escape")
  await expect(menu).toHaveCount(0)
  await expect(
    popover.getByRole("button", { name: "Plan actions" }),
  ).toBeFocused()
  await expectBackgroundOwned(page, true)
  await saveState(page, testInfo, "house-menu-closed")
  await page.keyboard.press("Escape")
  await expect(popover).toHaveCount(0)
  await expectBackgroundOwned(page, true)
  await expect(
    dialog.getByRole("button", { name: "Plan details" }),
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expectBackgroundOwned(page, false)
  await trigger.click()
  await openPicker(page, "Dialog equipment")
  await page.getByRole("button", { name: "Remove plan" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await expectBackgroundOwned(page, false)
  await saveState(page, testInfo, "house-parent-unmounted")
})

test("original NativeDialog and NativeField interoperate only through explicit host containment @a11y", async ({
  page,
}, testInfo) => {
  const trigger = page.getByRole("button", { name: "Open native host" })
  await trigger.click()

  const dialog = page.getByRole("dialog", {
    name: "Native equipment host",
    exact: true,
  })

  await expect(dialog).toBeVisible()
  const input = await openPicker(page, "Native equipment")
  const listId = await input.getAttribute("aria-controls")
  expect(listId).not.toBeNull()
  await expect(
    dialog.getByTestId("native-equipment-portal").getByRole("listbox"),
  ).toHaveAttribute("id", listId ?? "")
  await expectBackgroundOwned(page, true)
  await saveActiveLayout(input, testInfo, "original-native-host-open")
  await saveState(page, testInfo, "original-native-host-open")
  await input.press("Escape")
  await expectRelationship(input, false)
  await expect(input).toBeFocused()
  await expect(dialog).toBeVisible()
  await expectBackgroundOwned(page, true)
  await saveState(page, testInfo, "original-native-child-closed")
  await openPicker(page, "Native equipment")
  await input.press("Enter")
  await expectRelationship(input, false)
  await input.press("Tab")
  await expect(
    dialog.getByRole("button", { name: "Native host done" }),
  ).toBeFocused()
  await expect(dialog.getByTestId("native-equipment-field")).toHaveAttribute(
    "data-touched",
    "",
  )
  await expectBackgroundOwned(page, true)
  await saveState(page, testInfo, "original-native-field-touched")
  await dialog.getByRole("button", { name: "Native host done" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expectBackgroundOwned(page, false)
  await saveState(page, testInfo, "original-native-host-closed")
  await trigger.click()
  await openPicker(page, "Native equipment")
  await dialog.getByRole("button", { name: "Native host done" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expectBackgroundOwned(page, false)
  await saveState(page, testInfo, "original-native-parent-closed-first")
})

test("explicit modal blocks background activation and releases ownership on close @a11y", async ({
  page,
}, testInfo) => {
  const fixture = page.getByTestId("combobox-focus-workflows")
  await fixture.getByLabel("Equipment presentation").selectOption("modal")
  const input = await openPicker(page)
  await saveState(page, testInfo, "explicit-modal")

  const outside = fixture.getByRole("button", {
    name: "Before equipment",
    exact: true,
    includeHidden: true,
  })

  const box = await outside.boundingBox()
  expect(box).not.toBeNull()

  if (!box) throw new Error("Background target has no layout box")
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(outside).toHaveAttribute("data-activations", "0")

  if ((await input.getAttribute("aria-expanded")) === "true")
    await input.press("Escape")
  await expectRelationship(input, false)
  await outside.click()
  await expect(outside).toHaveAttribute("data-activations", "1")
  await saveState(page, testInfo, "explicit-modal-released")
})

test("actual inline list remains inline after selection and Escape @a11y", async ({
  page,
}, testInfo) => {
  const fixture = page.getByTestId("combobox-focus-workflows")
  await fixture.getByLabel("Equipment presentation").selectOption("inline")
  const input = await openPicker(page)
  await expect(
    fixture.getByTestId("equipment-inline").getByRole("listbox"),
  ).toBeVisible()
  await expect(page.getByTestId("equipment-popup")).toHaveCount(0)
  await input.press("Enter")
  await input.press("Escape")
  await expectRelationship(input, true)
  await saveState(page, testInfo, "actual-inline")
  await input.press("Tab")
  await expect(
    fixture.getByRole("button", { name: "Reserve equipment", exact: true }),
  ).toBeFocused()
})

test("long options remain visible through scroll, resize and custom render composition @a11y", async ({
  page,
}, testInfo) => {
  const input = await openPicker(page, "Equipment", "Station")

  for (let index = 0; index < 39; index += 1) await input.press("ArrowDown")
  const popup = page.getByTestId("equipment-popup")
  await expect(popup).toBeVisible()
  await expect
    .poll(() =>
      popup.evaluate(
        (node) =>
          Boolean(node.closest("main")) &&
          !node.closest('[data-slot="scroll-area-viewport"]'),
      ),
    )
    .toBe(true)

  for (const size of [
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size)
    await input.scrollIntoViewIfNeeded()
    await input.press("ArrowUp")
    await expectRelationship(input, true)

    await saveActiveLayout(input, testInfo, `layout-${size.width}`)
    const viewport = popup.locator('[data-slot="scroll-area-viewport"]')
    const oldTop = await viewport.evaluate((node) => node.scrollTop)
    await popup.hover()
    await page.mouse.wheel(0, -180)
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollTop))
      .toBeLessThan(oldTop)

    const thumb = popup.locator(
      '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"] [data-slot="scroll-area-thumb"]',
    )

    await expect(thumb).toBeVisible()
    const thumbBox = await thumb.boundingBox()
    expect(thumbBox).not.toBeNull()

    if (!thumbBox) throw new Error("Suggestion scrollbar has no layout box")
    const beforeDrag = await viewport.evaluate((node) => node.scrollTop)
    await page.mouse.move(
      thumbBox.x + thumbBox.width / 2,
      thumbBox.y + thumbBox.height / 2,
    )
    await page.mouse.down()
    await page.mouse.move(
      thumbBox.x + thumbBox.width / 2,
      thumbBox.y + thumbBox.height / 2 + 24,
      { steps: 6 },
    )
    await page.mouse.up()
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollTop))
      .toBeGreaterThan(beforeDrag)
    await saveState(page, testInfo, `layout-${size.width}`)
  }

  await input.fill("No matching equipment")
  await expect(page.getByRole("option")).toHaveCount(0)
  await expectRelationship(input, true)
  await saveState(page, testInfo, "empty-results")
})
