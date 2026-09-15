import { chromium, type Browser, type Page } from "@playwright/test"
import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { afterAll, beforeAll, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"

const root = resolve(import.meta.dirname, "../../../../..")
const registryRequire = createRequire(
  resolve(root, "packages/registry/package.json"),
)
const docsRequire = createRequire(resolve(root, "apps/docs/package.json"))
const compilerRequire = createRequire(docsRequire.resolve("@stylexjs/unplugin"))
const babelPath = compilerRequire.resolve("@babel/core")
const pluginPath = compilerRequire.resolve("@stylexjs/babel-plugin")
const stylex = registryRequire("@stylexjs/stylex")
const React = registryRequire("react")
const transpiler = new Bun.Transpiler({
  loader: "tsx",
  tsconfig: {
    compilerOptions: { jsx: "react", jsxFactory: "React.createElement" },
  },
})

function compile(name: string) {
  const filename = resolve(
    root,
    `packages/registry/src/components/ui/${name}.tsx`,
  )
  const source = readFileSync(filename, "utf8")
    .replace("const styles =", "export const styles =")
    .replaceAll("@registry/styles/", `${root}/packages/registry/src/styles/`)
  // Run the compiler in Node, matching Vite. Bun's media-query parser fails
  // after repeated compilations even for unchanged responsive style objects.
  const result = JSON.parse(
    execFileSync(
      "node",
      [
        "-e",
        `
    const result = require(${JSON.stringify(babelPath)}).transformSync(
      require('node:fs').readFileSync(0, 'utf8'), {
        filename: ${JSON.stringify(filename)},
        plugins: [[require(${JSON.stringify(pluginPath)}), {
          runtimeInjection: false,
          unstable_moduleResolution: {type: 'commonJS', rootDir: ${JSON.stringify(root)}}
        }]]
      });
    process.stdout.write(JSON.stringify(result));
  `,
      ],
      {
        input: transpiler.transformSync(source),
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
      },
    ),
  )
  const values = runInNewContext(
    `${result.code
      .replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "")
      .replace(/export\s*\{[^}]*\};?/g, "")
      .replace(
        /export /g,
        "",
      )}\n;({ styles, ${name === "group" ? "groupItemStyles" : ""} })`,
    { stylex, React },
  )
  return { ...values, rules: result.metadata.stylex }
}

const components = Object.fromEntries(
  [
    "alert",
    "badge",
    "frame",
    "group",
    "input",
    "input-group",
    "number-field",
    "toggle",
    "card",
    "table",
    "switch",
    "slider",
    "otp-field",
  ].map((name) => [name, compile(name)]),
)
const css = Object.values(components)
  .flatMap((component) => component.rules)
  .sort((a, b) => a[2] - b[2])
  .map((rule) => rule[1].ltr)
  .join("\n")
const classes = (...styles: Parameters<typeof stylex.props>) =>
  stylex.props(...styles).className
let browser: Browser
let page: Page
beforeAll(async () => {
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ viewport: { width: 800, height: 600 } })
})
afterAll(async () => {
  await browser?.close()
})

async function content(html: string) {
  await page.setContent(
    `<style>:root{--radius:10px;--radius-lg:10px;--radius-xl:14px;--input:#aaa;--ring:#00f;--destructive:#f00;--background:#fff;--foreground:#111;--card:#fff;--border:#aaa;--primary:#00f;--button-outline-shadow:0 1px 2px #0001}*{box-sizing:border-box;border-style:solid;border-width:0}button,input{font:inherit}${css}</style>${html}`,
  )
}

function computed(selector: string, property: string, pseudo?: string) {
  return page
    .locator(selector)
    .evaluate(
      (element, args) =>
        getComputedStyle(element, args.pseudo).getPropertyValue(args.property),
      { property, pseudo },
    )
}

test("display stylesheet has no fallback rules; every owned relationship compiles", () => {
  expect(css).toContain(':is([data-slot="group"]')
  expect(css).not.toContain('svg:not([class*="size-"])')
  expect(css).not.toContain(".border-b")
})

test("Group slots preserve hidden-sibling corners, seams, RTL and explicit overrides", async () => {
  const { styles, groupItemStyles } = components.group
  const item = classes(styles.text, groupItemStyles.item)
  await content(
    `<div data-slot="group" data-orientation="horizontal" class="${classes(styles.root, styles.horizontal)}"><input hidden><button id="first" data-slot="group-text" class="${item}">First</button><button id="last" data-slot="group-text" class="${item}">Last</button><input hidden></div>`,
  )
  expect(await computed("#first", "border-top-width")).toBe("1px")
  expect(await computed("#first", "border-start-start-radius")).toBe("10px")
  expect(await computed("#first", "border-start-end-radius")).toBe("0px")
  expect(await computed("#last", "border-start-end-radius")).toBe("10px")
  expect(await computed("#first", "inset-inline-end", "::before")).toBe(
    "-0.5px",
  )
  expect(await computed("#last", "inset-inline-start", "::before")).toBe(
    "-0.5px",
  )
  await page
    .locator('[data-slot="group"]')
    .evaluate((element) => element.setAttribute("dir", "rtl"))
  expect(await computed("#first", "border-top-right-radius")).toBe("10px")
  await page.locator("#first").focus()
  expect(await computed("#first", "z-index")).toBe("1")
  const overridden = classes(
    styles.text,
    groupItemStyles.item,
    components.card.styles.card,
  )
  await page.locator("#first").evaluate((element, className) => {
    element.setAttribute("class", className)
  }, overridden)
  expect(await computed("#first", "border-top-right-radius")).toBe("16px")
})

test("Input focus keeps invalid true distinct from false and disabled precedence", async () => {
  const { styles } = components.input
  await content(
    `<span id="control" data-slot="input-control" class="${classes(styles.control)}"><input id="input" data-slot="input" aria-invalid="false" class="${classes(styles.input)}"></span>`,
  )
  expect(await computed("#control", "border-top-color")).toBe(
    "rgb(170, 170, 170)",
  )
  await page.locator("#input").focus()
  expect(await computed("#control", "border-top-color")).toBe("rgb(0, 0, 255)")
  await page
    .locator("#input")
    .evaluate((element) => element.setAttribute("aria-invalid", "true"))
  expect(await computed("#control", "border-top-color")).toContain("0.36")
  expect(await computed("#control", "box-shadow")).toContain("0.24")
  await page
    .locator("#input")
    .evaluate((element) => element.setAttribute("disabled", ""))
  expect(await computed("#control", "opacity")).toBe("0.64")
  expect(await computed("#control", "box-shadow")).toBe("none")
})

test("Slider track insets and NumberField/OTP responsive sizes stay owned", async () => {
  const slider = components.slider.styles
  const number = components["number-field"].styles
  const otp = components["otp-field"].styles
  await content(
    `<div id="track" data-slot="slider-track" data-orientation="horizontal" class="${classes(slider.track)}"></div><div data-slot="number-field" data-size="sm"><input id="number" data-slot="number-field-input" class="${classes(number.input)}"></div><div id="otp" data-slot="otp-field" data-size="lg" class="${classes(otp.root, otp.largeSize)}"><input id="digit" data-slot="otp-field-input" class="${classes(otp.input)}"></div>`,
  )
  expect(await computed("#track", "inset-inline-start", "::before")).toBe("2px")
  expect(await computed("#track", "inset-block-start", "::before")).toBe("0px")
  await page
    .locator("#track")
    .evaluate((element) => element.setAttribute("data-orientation", "vertical"))
  expect(await computed("#track", "inset-inline-start", "::before")).toBe("0px")
  expect(await computed("#track", "inset-block-start", "::before")).toBe("2px")
  expect(await computed("#number", "height")).toBe("30px")
  expect(await computed("#digit", "height")).toBe("40px")
  expect(await computed("#digit", "font-size")).toBe("16px")
  await page.setViewportSize({ width: 500, height: 600 })
  expect(await computed("#number", "height")).toBe("30px")
  expect(await computed("#digit", "height")).toBe("40px")
  expect(await computed("#digit", "font-size")).toBe("18px")
  await page.setViewportSize({ width: 800, height: 600 })
})

test("Card/table relationship styles and explicit separators preserve spacing", async () => {
  const card = components.card.styles
  const table = components.table.styles
  await content(
    `<div data-slot="card" class="${classes(card.card)}"><header data-slot="card-header" class="${classes(card.header)}">Header</header><div id="panel" data-slot="card-panel" class="${classes(card.panel)}">Panel</div><footer data-slot="card-footer" class="${classes(card.footer)}">Footer</footer></div><div data-slot="table-container" data-variant="card"><table class="${classes(table.table)}" data-slot="table"><tbody data-slot="table-body"><tr data-slot="table-row" class="${classes(table.row)}"><td id="cell" data-slot="table-cell" class="${classes(table.cell)}">Cell</td></tr></tbody></table></div>`,
  )
  expect(await computed("#panel", "padding-top")).toBe("0px")
  expect(await computed("#panel", "padding-bottom")).toBe("0px")
  await page
    .locator('[data-slot="card-header"]')
    .evaluate((element) => element.setAttribute("data-separator", ""))
  expect(await computed("#panel", "padding-top")).toBe("24px")
  expect(await computed("#cell", "border-bottom-width")).toBe("0px")
  await page.locator("#cell").hover()
  expect(await computed("#cell", "background-color")).toBe(
    "color(srgb 0.98 0.98 0.98)",
  )
})

test("Vertical Group seams and ToggleGroup orientation stay exact", async () => {
  const { styles, groupItemStyles } = components.group
  const toggle = components.toggle.styles
  await content(
    `<div data-theme="dark"><div data-slot="group" data-orientation="vertical" class="${classes(styles.root, styles.vertical)}"><button id="top" data-slot="group-text" class="${classes(styles.text, groupItemStyles.item)}">Top</button><button id="bottom" data-slot="group-text" class="${classes(styles.text, groupItemStyles.item)}">Bottom</button></div></div><div data-slot="toggle-group" data-variant="outline" data-orientation="vertical"><button id="toggle" data-slot="toggle" class="${classes(toggle.root, toggle.outline)}">First</button><button data-slot="toggle" class="${classes(toggle.root, toggle.outline)}">Last</button></div>`,
  )
  expect(await computed("#top", "border-bottom-left-radius")).toBe("0px")
  expect(await computed("#bottom", "border-bottom-left-radius")).toBe("10px")
  expect(await computed("#top", "display", "::before")).toBe("block")
  expect(await computed("#bottom", "display", "::before")).toBe("none")
  expect(await computed("#toggle", "border-bottom-width")).toBe("0px")
  expect(await computed("#toggle", "border-bottom-left-radius")).toBe("0px")
})

test("Coarse targets apply to interactive badges, toggles and number steppers only", async () => {
  const desktop = page
  page = await browser.newPage({ hasTouch: true })
  try {
    const badge = components.badge.styles
    const toggle = components.toggle.styles
    const number = components["number-field"].styles
    await content(
      `<button id="badge" data-slot="badge" class="${classes(badge.root, badge.sizeDefault, badge.default)}">Badge</button><span id="plain" data-slot="badge" class="${classes(badge.root, badge.sizeDefault, badge.default)}">Plain</span><button id="toggle" data-slot="toggle" class="${classes(toggle.root, toggle.sizeDefault)}">Toggle</button><button id="step" data-slot="number-field-increment" class="${classes(number.stepper)}">+</button>`,
    )
    expect(await computed("#badge", "cursor")).toBe("pointer")
    expect(await computed("#badge", "height", "::after")).toBe("44px")
    expect(await computed("#toggle", "height", "::after")).toBe("44px")
    expect(await computed("#step", "height", "::after")).toBe("44px")
    expect(await computed("#plain", "content", "::after")).toBe("none")
  } finally {
    await page.close()
    page = desktop
  }
})

test("Switch label active scales owned thumb without changing translate or disabled state", async () => {
  const { styles } = components.switch
  await content(
    `<label data-slot="field-label"><button role="switch" class="${classes(styles.root)}"><span id="thumb" data-slot="switch-thumb" class="${classes(styles.thumb)}"></span></button>Label</label>`,
  )
  await page.locator('[role="switch"]').hover()
  await page.mouse.down()
  await page.waitForFunction(
    () => getComputedStyle(document.getElementById("thumb")!).scale === "1.1 1",
  )
  expect(await computed("#thumb", "transform")).toBe("matrix(1, 0, 0, 1, 0, 0)")
  await page
    .locator("#thumb")
    .evaluate((element) => element.setAttribute("data-disabled", ""))
  await page.waitForFunction(
    () => getComputedStyle(document.getElementById("thumb")!).scale === "none",
  )
  await page.mouse.up()
})

defineRegistrySourceContract(import.meta.url)
