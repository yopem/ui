import { chromium, type Browser } from "@playwright/test"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const registryRequire = createRequire(
  resolve(root, "packages/registry/package.json"),
)
const stylex = registryRequire("@stylexjs/stylex")
const names = [
  "accordion",
  "tabs",
  "menu",
  "context-menu",
  "drawer",
  "dialog",
  "sheet",
  "popover",
  "tooltip",
  "autocomplete",
  "combobox",
  "select",
  "calendar",
  "sidebar",
  "toast",
]
const fixtures = JSON.parse(
  execFileSync(
    "node",
    [resolve(root, "tests/strict-overlays-compiler.mjs"), ...names],
    { encoding: "utf8" },
  ),
) as Record<string, { styles: Record<string, unknown>; css: string }>
function classes(name: string, ...keys: string[]) {
  return stylex.props(...keys.map((key) => fixtures[name].styles[key]))
    .className
}
let browser: Browser
beforeAll(async () => {
  browser = await chromium.launch({ headless: true })
})
afterAll(async () => {
  await browser?.close()
})

async function pageFor(name: string, markup: string, width = 900) {
  const page = await browser.newPage({ viewport: { width, height: 800 } })
  await page.setContent(
    `<style>:root { --primary: rgb(20, 40, 60); --primary-foreground: rgb(255, 255, 255); --accent: rgb(220, 220, 220); --foreground: rgb(1, 2, 3); --muted-foreground: rgb(100, 100, 100); --radius-lg: 10px; --sidebar-width: 256px; --sidebar-width-icon: 48px; --sidebar: rgb(20, 30, 40); --anchor-width: 120px; --thumb-size: 16px; } ${fixtures[name].css}</style>${markup}`,
  )
  return page
}

describe("strict overlay StyleX contracts", () => {
  test("all owned modules compile; only three upstream wrapper rules remain", () => {
    expect(Object.keys(fixtures)).toHaveLength(15)
    const css = readFileSync(
      resolve(root, "packages/registry/src/styles/styles.css"),
      "utf8",
    )
    const upstream = css.slice(css.indexOf("/* Base UI owns"))
    expect(upstream.match(/\{/g)).toHaveLength(3)
    expect(upstream).not.toMatch(/svg|calendar|sidebar|switch-thumb/)
  })

  test("consumer overrides remove relationship styles; theme rules require markers", async () => {
    const marker = fixtures.dialog.css.match(
      /:where\(\.([\w-]+)\[data-theme="dark"\]/,
    )?.[1]
    expect(marker).toBeTruthy()
    const page = await pageFor(
      "dialog",
      `<div data-theme="dark" class="${marker}"><div id="popup" data-slot="dialog-popup" class="${classes("dialog", "popup")}"><div data-slot="dialog-panel"></div><header id="header" data-slot="dialog-header" class="${classes("dialog", "header", "override")}"></header></div></div>`,
    )
    expect(
      await page
        .locator("#header")
        .evaluate((el) => getComputedStyle(el).paddingBottom),
    ).toBe("48px")
    expect(
      await page
        .locator("#popup")
        .evaluate((el) => getComputedStyle(el, "::before").boxShadow),
    ).toContain("-1px")
    await page
      .locator("[data-theme]")
      .evaluate((el) => el.removeAttribute("class"))
    expect(
      await page
        .locator("#popup")
        .evaluate((el) => getComputedStyle(el, "::before").boxShadow),
    ).not.toContain("-1px")
    await page.close()
  })

  test("input padding, list overflow, chip adjacency and Select Group line-height", async () => {
    for (const name of ["autocomplete", "combobox"]) {
      const page = await pageFor(
        name,
        `<div data-slot="${name}-input-group" data-size="sm" data-has-start-addon><span><input id="input" class="${classes(name, "inputPadding")}" /></span><button data-slot="${name}-trigger" class="${classes(name, "trigger")}"></button><button data-slot="${name}-clear"></button></div><ul id="list" data-has-overflow-y class="${classes(name, "list")}"><li>Item</li></ul>`,
      )
      expect(
        await page
          .locator("#input")
          .evaluate((el) => getComputedStyle(el).paddingInlineStart),
      ).toBe("33px")
      expect(
        await page
          .locator("#input")
          .evaluate((el) => getComputedStyle(el).paddingInlineEnd),
      ).toBe("26px")
      expect(
        await page
          .locator(`[data-slot="${name}-trigger"]`)
          .evaluate((el) => getComputedStyle(el).display),
      ).toBe("none")
      expect(
        await page
          .locator("#list")
          .evaluate((el) => getComputedStyle(el).paddingInlineEnd),
      ).toBe("12px")
      await page.close()
    }
    const page = await pageFor(
      "combobox",
      `<div><span data-slot="combobox-chip"></span><input data-slot="combobox-chips-input" class="${classes("combobox", "chipsInput", "chipsInputSmall")}" /></div>`,
    )
    expect(
      await page
        .locator("input")
        .evaluate((el) => getComputedStyle(el).paddingInlineStart),
    ).toBe("2px")
    expect(
      await page
        .locator("input")
        .evaluate((el) => getComputedStyle(el).minBlockSize),
    ).toBe("24px")
    await page.close()
    const select = await pageFor(
      "select",
      `<div data-slot="group"><button data-slot="select-trigger" class="${classes("select", "trigger")}"></button></div>`,
    )
    expect(
      await select
        .locator("button")
        .evaluate((el) => getComputedStyle(el).lineHeight),
    ).toBe("20px")
    await select.setViewportSize({ width: 500, height: 800 })
    expect(
      await select
        .locator("button")
        .evaluate((el) => getComputedStyle(el).lineHeight),
    ).toBe("24px")
    await select.close()
  })

  test("direct tabs and overlay headers do not style wrapped siblings", async () => {
    const page = await pageFor(
      "dialog",
      `<div data-slot="dialog-popup"><div data-slot="dialog-panel"></div><header id="direct" data-slot="dialog-header" class="${classes("dialog", "header")}"></header><section><header id="nested" data-slot="dialog-header" class="${classes("dialog", "header")}"></header></section><footer id="footer" data-slot="dialog-footer" data-variant="bare" class="${classes("dialog", "footer", "footerBare")}"></footer></div>`,
      500,
    )
    expect(
      await page
        .locator("#direct")
        .evaluate((el) => getComputedStyle(el).paddingBottom),
    ).toBe("12px")
    expect(
      await page
        .locator("#nested")
        .evaluate((el) => getComputedStyle(el).paddingBottom),
    ).toBe("16px")
    expect(
      await page
        .locator("#footer")
        .evaluate((el) => getComputedStyle(el).paddingTop),
    ).toBe("12px")
    await page.close()
    const tabs = await pageFor(
      "tabs",
      `<div data-slot="tabs-list"><button data-slot="tabs-tab" class="${classes("tabs", "tab")}">Tab</button></div>`,
    )
    await tabs.locator("button").hover()
    expect(
      await tabs
        .locator("button")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(220, 220, 220)")
    await tabs.close()
  })

  test("calendar range edges, one-day range, today, outside, disabled and RTL", async () => {
    const day = (id: string, modifiers: string[], attrs = "") =>
      `<td ${attrs} class="${classes("calendar", "day", ...modifiers)}"><button id="${id}" class="${classes("calendar", "button", "dayButton")}">${id}</button></td>`
    const page = await pageFor(
      "calendar",
      `<div dir="rtl" class="${classes("calendar", "root")}"><svg id="chevron" class="${classes("calendar", "icon", "directionIcon")}"></svg><table><tr>${day("start", ["rangeStart"], "data-selected")}${day("middle", ["rangeMiddle"], "data-selected")}${day("end", ["rangeEnd"], "data-selected")}${day("single", ["rangeStart", "rangeEnd", "today"], "data-selected")}${day("outside", [], "data-selected data-outside")}${day("disabled", [], "data-disabled")}</tr></table></div>`,
    )
    const computed = (id: string) =>
      page.locator(`#${id}`).evaluate((el) => {
        const s = getComputedStyle(el)
        return {
          start: s.borderStartStartRadius,
          end: s.borderStartEndRadius,
          background: s.backgroundColor,
          color: s.color,
          pointer: s.pointerEvents,
          decoration: s.textDecorationLine,
        }
      })
    expect(await computed("start")).toMatchObject({
      start: "10px",
      end: "0px",
      background: "rgb(20, 40, 60)",
    })
    expect(await computed("middle")).toMatchObject({
      start: "0px",
      end: "0px",
      background: "rgb(220, 220, 220)",
      color: "rgb(1, 2, 3)",
    })
    expect(await computed("end")).toMatchObject({ start: "0px", end: "10px" })
    expect(await computed("single")).toMatchObject({
      start: "10px",
      end: "10px",
    })
    expect(await computed("disabled")).toMatchObject({
      pointer: "none",
      decoration: "line-through",
    })
    expect((await computed("outside")).color).not.toBe("rgb(255, 255, 255)")
    expect(
      await page
        .locator("#single")
        .evaluate((el) => getComputedStyle(el, "::after").content),
    ).toBe('""')
    expect(
      await page
        .locator("#chevron")
        .evaluate((el) => getComputedStyle(el).rotate),
    ).toBe("180deg")
    await page.close()
  })

  test("sidebar offcanvas, icon, adjacent action offsets and inset", async () => {
    const page = await pageFor(
      "sidebar",
      `<div class="${classes("sidebar", "wrapper")}"><aside id="sidebar" data-slot="sidebar" data-collapsible="offcanvas" data-side="left" data-variant="inset"><div id="gap" class="${classes("sidebar", "gap")}"></div><div id="container" class="${classes("sidebar", "container", "left")}"><div data-slot="sidebar-menu-item"><button data-slot="sidebar-menu-button" data-size="lg">Item</button><button id="action" class="${classes("sidebar", "menuAction", "menuActionHover")}">Action</button></div></div></aside><main id="inset" class="${classes("sidebar", "inset")}"></main></div>`,
    )
    expect(
      await page.locator("#gap").evaluate((el) => getComputedStyle(el).width),
    ).toBe("0px")
    expect(
      await page
        .locator("#container")
        .evaluate((el) => getComputedStyle(el).insetInlineStart),
    ).toBe("-256px")
    expect(
      await page.locator("#action").evaluate((el) => getComputedStyle(el).top),
    ).toBe("10px")
    expect(
      await page
        .locator("#inset")
        .evaluate((el) => getComputedStyle(el).marginInlineStart),
    ).toBe("0px")
    await page
      .locator("#sidebar")
      .evaluate((el) => el.setAttribute("data-collapsible", "icon"))
    await page.waitForTimeout(220)
    expect(
      await page
        .locator("#container")
        .evaluate((el) => getComputedStyle(el).width),
    ).toBe("48px")
    expect(
      await page
        .locator("#action")
        .evaluate((el) => getComputedStyle(el).display),
    ).toBe("none")
    await page.close()
  })

  test("calendar popup keeps viewport geometry and upstream transition wrappers", async () => {
    const retained = readFileSync(
      resolve(root, "packages/registry/src/styles/styles.css"),
      "utf8",
    )
    const page = await pageFor(
      "popover",
      `<style>* { box-sizing: border-box } ${retained}</style><div id="popup" data-slot="popover-popup" class="${classes("popover", "popup")}" style="--popup-width:300px"><div id="viewport" data-slot="popover-viewport" class="${classes("popover", "viewport")}"><div id="current" data-current><div data-slot="calendar"></div></div></div></div>`,
    )
    expect(
      await page
        .locator("#popup")
        .evaluate((el) => getComputedStyle(el).borderRadius),
    ).toBe("14px")
    expect(
      await page
        .locator("#popup")
        .evaluate((el) => getComputedStyle(el, "::before").borderRadius),
    ).toBe("13px")
    expect(
      await page
        .locator("#viewport")
        .evaluate((el) => getComputedStyle(el).paddingInlineStart),
    ).toBe("8px")
    expect(
      await page
        .locator("#current")
        .evaluate((el) => getComputedStyle(el).inlineSize),
    ).toBe("282px")
    await page
      .locator("#current")
      .evaluate((el) => el.setAttribute("data-starting-style", ""))
    expect(
      await page
        .locator("#current")
        .evaluate((el) => getComputedStyle(el).opacity),
    ).toBe("0")
    await page.close()
    for (const name of ["select", "combobox"]) {
      const item = await pageFor(
        name,
        `<div data-slot="select-positioner" data-side="none"><div data-slot="${name}-item" class="${classes(name, "item")}"></div></div>`,
      )
      expect(
        await item
          .locator(`[data-slot="${name}-item"]`)
          .evaluate((el) => getComputedStyle(el).minInlineSize),
      ).toBe("140px")
      await item.close()
    }
  })

  test("menu switches retain movement; stacked toast blocks pointers", async () => {
    for (const name of ["menu", "context-menu", "drawer"]) {
      const slot = name === "drawer" ? "drawer-menu" : name
      const page = await pageFor(
        name,
        `<div data-slot="${slot}-checkbox-item" data-checked><span class="${classes(name, "switch")}"><span id="thumb" data-slot="${slot}-switch-thumb" class="${classes(name, "switchThumb")}"></span></span></div>`,
      )
      expect(
        await page
          .locator("#thumb")
          .evaluate((el) => getComputedStyle(el).translate),
      ).toBe("8px")
      await page.close()
    }
    const page = await pageFor(
      "toast",
      `<div id="root" data-slot="toast-root" data-behind><div id="content" data-slot="toast-content" class="${classes("toast", "content")}"></div></div>`,
    )
    expect(
      await page
        .locator("#content")
        .evaluate((el) => getComputedStyle(el).pointerEvents),
    ).toBe("none")
    await page
      .locator("#root")
      .evaluate((el) => el.setAttribute("data-expanded", ""))
    expect(
      await page
        .locator("#content")
        .evaluate((el) => getComputedStyle(el).pointerEvents),
    ).toBe("auto")
    await page.close()
  })
})
