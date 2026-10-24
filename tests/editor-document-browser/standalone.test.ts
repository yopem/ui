import { chromium } from "@playwright/test"
import { expect, test } from "bun:test"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

test("standalone downloaded files preserve actual light and dark semantic palette", async () => {
  const compile = Bun.spawn(
    [
      "bun",
      "--eval",
      'import {transformFileSync} from "@babel/core"; import stylex from "@stylexjs/babel-plugin"; const result=transformFileSync("../../packages/registry/src/styles/tokens.stylex.ts",{configFile:false,babelrc:false,plugins:[[stylex,{dev:false,unstable_moduleResolution:{type:"commonJS",rootDir:process.cwd()+"/../.."}}]]}); process.stdout.write(JSON.stringify(result))',
    ],
    { cwd: resolve(root, "apps/docs"), stdout: "pipe", stderr: "pipe" },
  )

  const [status, source, diagnostics] = await Promise.all([
    compile.exited,
    new Response(compile.stdout).text(),
    new Response(compile.stderr).text(),
  ])

  expect(status, diagnostics).toBe(0)

  const compiled = z
    .object({
      code: z.string(),
      metadata: z.object({
        stylex: z.array(
          z.tuple([z.string(), z.object({ ltr: z.string() }), z.number()]),
        ),
      }),
    })
    .parse(JSON.parse(source))

  const bundle = await Bun.build({
    entrypoints: [resolve(root, "tests/editor-document/browser-fixture.ts")],
    target: "browser",
    plugins: [
      {
        name: "compiled-tokens",
        setup(build) {
          build.onLoad({ filter: /tokens\.stylex\.ts$/ }, () => ({
            contents: compiled.code,
            loader: "js",
          }))
        },
      },
    ],
  })

  expect(bundle.success).toBe(true)
  const script = await bundle.outputs[0]?.text()

  if (!script) throw new Error("Missing fixture bundle")
  const css = compiled.metadata.stylex.map((entry) => entry[1].ltr).join("\n")

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      if (new URL(request.url).pathname === "/fixture.js")
        return new Response(script, {
          headers: { "Content-Type": "text/javascript" },
        })

      return new Response(
        `<!doctype html><html lang="en"><head><title>Document export</title><style>${css}</style></head><body><main><div id="editor" aria-label="Editor"></div><button id="export">Export</button><button id="download">Download</button><textarea id="output" aria-label="Output"></textarea></main><script type="module" src="/fixture.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    },
  })

  const browser = await chromium.launch({ channel: "chromium", headless: true })

  try {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage()
      page.setDefaultTimeout(30_000)
      page.on("pageerror", console.error)
      await page.goto(`${server.url}?theme=${theme}`)
      await page.getByText("Paired", { exact: true }).waitFor()

      const sourceRel = await page
        .getByRole("link", { name: "Reference", exact: true })
        .getAttribute("rel")

      expect(new Set(sourceRel?.split(/\s+/))).toEqual(
        new Set(["nofollow", "noreferrer", "noopener"]),
      )

      const before = await page
        .locator("#editor span")
        .filter({ hasText: /^(Foreground|Danger|Paired)$/ })
        .evaluateAll((elements) =>
          elements.map((element) => ({
            color: getComputedStyle(element).color,
            background: getComputedStyle(element).backgroundColor,
          })),
        )

      const background = await page
        .locator("body")
        .evaluate((element) => getComputedStyle(element).backgroundColor)

      const pending = page.waitForEvent("download")
      await page.getByRole("button", { name: "Download", exact: true }).click()
      const download = await pending

      const directory = resolve(
        root,
        "test-results/editor-io-standalone",
        theme,
      )

      await mkdir(directory, { recursive: true })
      const file = resolve(directory, download.suggestedFilename())
      await download.saveAs(file)
      expect(await download.failure()).toBeNull()
      expect(await readFile(file, "utf8")).toContain("<!doctype html>")
      await page.goto(`file://${file}`)

      const exportedRel = await page
        .getByRole("link", { name: "Reference", exact: true })
        .getAttribute("rel")

      expect(new Set(exportedRel?.split(/\s+/))).toEqual(
        new Set(["nofollow", "noreferrer", "noopener"]),
      )

      const after = await page
        .locator("span")
        .filter({ hasText: /^(Foreground|Danger|Paired)$/ })
        .evaluateAll((elements) =>
          elements.map((element) => ({
            color: getComputedStyle(element).color,
            background: getComputedStyle(element).backgroundColor,
          })),
        )

      const exportedBackground = await page
        .locator("body")
        .evaluate((element) => getComputedStyle(element).backgroundColor)

      await writeFile(
        resolve(directory, "colors.json"),
        JSON.stringify(
          { before, after, background, exportedBackground },
          null,
          2,
        ),
      )
      await page.screenshot({
        path: resolve(directory, "document.png"),
        scale: "css",
      })
      expect(after).toEqual(before)
      expect(exportedBackground).toBe(background)
      await page.close()
      const surface = await browser.newPage()
      surface.setDefaultTimeout(30_000)
      await surface.goto(`${server.url}?theme=${theme}`)
      await surface.getByText("Paired", { exact: true }).waitFor()
      await surface.evaluate(() => {
        document.body.style.backgroundColor = "transparent"
        document.documentElement.style.backgroundColor = "transparent"
      })
      const pendingError = surface.waitForEvent("pageerror", { timeout: 5000 })
      await surface.getByRole("button", { name: "Export", exact: true }).click()
      const failure = await pendingError
      expect(failure.name).toBe("DocumentError")
      expect(
        await surface
          .getByRole("textbox", { name: "Output", exact: true })
          .inputValue(),
      ).toBe("")
      await surface.evaluate((value) => {
        document.body.style.backgroundColor = value
      }, background)
      await surface.getByText("Danger", { exact: true }).evaluate((node) => {
        const variable = node.style.color.match(/^var\((--[-\w]+)\)$/)?.[1]

        if (!variable) throw new Error("Color variable is missing.")
        node.ownerDocument.documentElement.style.setProperty(
          variable,
          "currentColor",
        )
      })

      const pendingContextError = surface.waitForEvent("pageerror", {
        timeout: 5000,
      })

      await surface.getByRole("button", { name: "Export", exact: true }).click()
      const contextFailure = await pendingContextError
      expect(contextFailure.name).toBe("DocumentError")
      expect(
        await surface
          .getByRole("textbox", { name: "Output", exact: true })
          .inputValue(),
      ).toBe("")
      await surface.close()
    }
  } finally {
    await browser.close()
    await server.stop(true)
  }
}, 90_000)
