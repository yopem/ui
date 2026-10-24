import { chromium, expect as browserExpect } from "@playwright/test"
import { test, expect } from "bun:test"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { browserPng, createBrowserFixture } from "./browser-fixture"

test("authenticated HTTPS browser delivery and cross-origin rejection", async function browserDelivery() {
  const tls = process.env.ASSET_BROWSER_TLS_DIR
  const output = process.env.ASSET_BROWSER_ARTIFACTS

  if (!tls || !output)
    throw new Error("Set ASSET_BROWSER_TLS_DIR and ASSET_BROWSER_ARTIFACTS")
  const artifacts = resolve(output)
  await mkdir(artifacts, { recursive: true })
  await writeFile(`${artifacts}/input.png`, browserPng)

  const fixture = await createBrowserFixture(
    await readFile(`${tls}/key.pem`, "utf8"),
    await readFile(`${tls}/cert.pem`, "utf8"),
  )

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    headless: true,
  })

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  })

  const page = await context.newPage()
  const baseline = process.env.ASSET_BROWSER_BASELINE === "1"

  try {
    await page.goto(fixture.origin)
    await page.getByRole("button", { name: "Login fixture" }).click()
    await browserExpect(page.locator("#result")).toHaveText("login:204")
    await page.getByLabel("PNG file").setInputFiles(`${artifacts}/input.png`)
    await page.getByRole("button", { name: "Upload", exact: true }).click()
    await browserExpect(page.locator("#result")).toHaveText("upload:201")
    await page.getByRole("button", { name: "Fetch asset" }).click()
    await browserExpect(page.locator("#result")).toHaveText(
      `fetch:${baseline ? 403 : 200}:${baseline ? 17 : browserPng.length}`,
    )

    const href = await page
      .getByRole("link", { name: "Download", exact: true })
      .getAttribute("href")

    if (!href) throw new Error("missing-asset-url")

    const image = await page
      .locator("#image")
      .evaluate(async function decode(element) {
        if (!(element instanceof HTMLImageElement)) throw new Error("not-image")

        try {
          await element.decode()

          return {
            decoded: true,
            width: element.naturalWidth,
            height: element.naturalHeight,
          }
        } catch {
          return {
            decoded: false,
            width: element.naturalWidth,
            height: element.naturalHeight,
          }
        }
      })

    expect(image).toEqual({
      decoded: !baseline,
      width: baseline ? 0 : 1,
      height: baseline ? 0 : 1,
    })

    if (baseline) {
      await page.getByRole("link", { name: "Download", exact: true }).click()
      await page.waitForTimeout(300)
      await page.goto(fixture.origin)
      await page.evaluate((url) => {
        const link = document.createElement("a")
        link.href = url
        link.textContent = "Baseline navigation"
        document.body.append(link)
      }, href)
      await page.getByRole("link", { name: "Baseline navigation" }).click()
      await browserExpect(page.locator("body")).toContainText("origin")
    } else {
      const downloadEvent = page.waitForEvent("download")
      await page.getByRole("link", { name: "Download", exact: true }).click()
      const download = await downloadEvent
      await download.saveAs(`${artifacts}/download.png`)
      expect(await readFile(`${artifacts}/download.png`)).toEqual(browserPng)
      const navigationDownloadEvent = page.waitForEvent("download")
      await page.getByRole("link", { name: "Open asset", exact: true }).click()
      await (
        await navigationDownloadEvent
      ).saveAs(`${artifacts}/navigation-download.png`)
      expect(await readFile(`${artifacts}/navigation-download.png`)).toEqual(
        browserPng,
      )

      const range = await page.evaluate(async function readRange(url) {
        const response = await fetch(url, { headers: { Range: "bytes=1-3" } })

        return {
          status: response.status,
          bytes: Array.from(new Uint8Array(await response.arrayBuffer())),
          range: response.headers.get("Content-Range"),
          disposition: response.headers.get("Content-Disposition"),
          cache: response.headers.get("Cache-Control"),
          nosniff: response.headers.get("X-Content-Type-Options"),
        }
      }, href)

      expect(range).toMatchObject({
        status: 206,
        bytes: Array.from(browserPng.subarray(1, 4)),
        range: `bytes 1-3/${browserPng.length}`,
        cache: "private, no-store",
        nosniff: "nosniff",
      })
      expect(range.disposition).toStartWith("attachment;")

      for (const policy of ["document-deny", "asset-deny"] as const) {
        fixture.setPolicy(policy)
        expect(
          await page.evaluate(async (url) => (await fetch(url)).status, href),
        ).toBe(403)
      }

      fixture.setPolicy("allow")
      fixture.setExpiry(Date.now() - 1)
      expect(
        await page.evaluate(async (url) => (await fetch(url)).status, href),
      ).toBe(401)
      fixture.setExpiry(Date.now() + 60000)
      fixture.setBearerOnly(true)
      expect(
        await page.evaluate(async (url) => (await fetch(url)).status, href),
      ).toBe(401)
      fixture.setBearerOnly(false)
      await page.screenshot({
        path: `${artifacts}/same-origin.png`,
        scale: "css",
      })

      const outsider = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        tls: {
          key: await readFile(`${tls}/key.pem`, "utf8"),
          cert: await readFile(`${tls}/cert.pem`, "utf8"),
        },
        fetch() {
          return new Response("<!doctype html><title>Other origin</title>", {
            headers: { "Content-Type": "text/html" },
          })
        },
      })

      try {
        await page.goto(outsider.url.href)

        const denial = await page.evaluate(async function crossOrigin(url) {
          const image = new Image()
          image.src = url
          let decoded = false

          try {
            await image.decode()
            decoded = true
          } catch {
            decoded = false
          }

          let readable = false

          try {
            readable = (await fetch(url, { credentials: "include" })).ok
          } catch {
            readable = false
          }

          return { decoded, readable }
        }, `${fixture.origin}${href}`)

        expect(denial).toEqual({ decoded: false, readable: false })
        await page.evaluate((url) => {
          const link = document.createElement("a")
          link.href = url
          link.textContent = "Cross-origin navigation"
          document.body.append(link)
        }, `${fixture.origin}${href}`)
        await page
          .getByRole("link", { name: "Cross-origin navigation" })
          .click()
        await browserExpect(page.locator("body")).toContainText("origin")
        await page.goto("https://localhost:" + outsider.port)
        expect(
          await page.evaluate(async function crossSite(url) {
            const image = new Image()
            image.src = url

            try {
              await image.decode()

              return true
            } catch {
              return false
            }
          }, `${fixture.origin}${href}`),
        ).toBe(false)
      } finally {
        await outsider.stop(true)
      }

      const direct = await context.newPage()
      const response = await direct.goto(`${fixture.origin}${href}`)
      expect(response?.status()).toBe(403)
      await direct.close()
    }

    await writeFile(
      `${artifacts}/browser-result.json`,
      JSON.stringify(
        {
          baseline,
          browser: browser.version(),
          image,
          records: fixture.records,
        },
        null,
        2,
      ),
    )
  } finally {
    await writeFile(
      `${artifacts}/request-records.json`,
      JSON.stringify(fixture.records, null, 2),
    )
    await browser.close()
    await fixture.close()
  }
}, 90000)
