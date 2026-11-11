import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

const scenarios = [
  { name: "start", start: 5, reversed: false, value: null },
  { name: "reversed", start: null, reversed: true, value: null },
  { name: "reversed start", start: 5, reversed: true, value: null },
  { name: "item value", start: 5, reversed: false, value: 9 },
] as const

for (const scenario of scenarios) {
  test(`Steps preserves native ${scenario.name} numbering`, async ({
    page,
  }, testInfo) => {
    await openPreview(page, "steps")

    const steps = page.locator('[data-slot="steps"]')
    const useLastStep = scenario.start === null && scenario.reversed

    const expected = await steps.evaluate(
      (list, input) => {
        if (!(list instanceof HTMLOListElement))
          throw new Error("Steps must render an ordered list")

        if (input.start === null) list.removeAttribute("start")
        else list.start = input.start

        list.reversed = input.reversed

        const items = Array.from(list.children).filter(
          (item): item is HTMLLIElement => item instanceof HTMLLIElement,
        )

        const numbered = input.useLastStep
          ? items.at(-1)
          : items.find((item) => item.getAttribute("aria-current") === "step")

        if (!numbered) throw new Error("The numbered step is missing")

        for (const item of items) item.removeAttribute("value")

        if (input.value !== null) numbered.value = input.value

        const start = input.start ?? (input.reversed ? items.length : 1)
        const offset = items.indexOf(numbered) * (input.reversed ? -1 : 1)

        return input.value ?? start + offset
      },
      { ...scenario, useLastStep },
    )

    const target = steps.locator(
      useLastStep ? "li:last-child" : '[aria-current="step"]',
    )

    const fontSize = await target.evaluate((item) =>
      Number.parseFloat(getComputedStyle(item, "::marker").fontSize),
    )

    expect(fontSize).toBeGreaterThan(0)

    const session = await page.context().newCDPSession(page)

    try {
      await session.send("DOM.enable")
      await session.send("Accessibility.enable")

      const document = await session.send("DOM.getDocument")

      const current = await session.send("DOM.querySelector", {
        nodeId: document.root.nodeId,
        selector: useLastStep
          ? '[data-slot="steps"] > li:last-child'
          : '[data-slot="steps"] > [aria-current="step"]',
      })

      const described = await session.send("DOM.describeNode", {
        nodeId: current.nodeId,
      })

      const marker = described.node.pseudoElements?.find(
        (node) => node.pseudoType === "marker",
      )

      if (!marker) throw new Error("The rendered step marker is missing")

      const tree = await session.send("Accessibility.getPartialAXTree", {
        backendNodeId: marker.backendNodeId,
        fetchRelatives: true,
      })

      const text = tree.nodes.find(
        (node) => node.backendDOMNodeId === marker.backendNodeId,
      )?.name?.value

      await testInfo.attach("native-step-number", {
        body: Buffer.from(
          JSON.stringify({ scenario, expected, nodes: tree.nodes }, null, 2),
        ),
        contentType: "application/json",
      })
      await testInfo.attach("rendered-steps", {
        body: await steps.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
      expect(Number.parseInt(String(text), 10)).toBe(expected)
    } finally {
      await session.detach()
    }
  })
}
