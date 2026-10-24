import { chromium, expect as browserExpect } from "@playwright/test"
import { expect, test } from "bun:test"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { z } from "zod"

import { createBrowserFixture } from "./browser-fixture"
import { mediaAudio, mediaFile, mediaVideo } from "./media-fixtures"

test("native HTTPS media decodes, plays, ranges and private files download", async function mediaWorkflow() {
  const tls = process.env.ASSET_BROWSER_TLS_DIR
  const output = process.env.ASSET_BROWSER_ARTIFACTS

  if (!tls || !output) throw new Error("browser-fixture-env")
  const artifacts = resolve(output, "general")
  await mkdir(artifacts, { recursive: true })

  const fixture = await createBrowserFixture(
    await readFile(`${tls}/key.pem`, "utf8"),
    await readFile(`${tls}/cert.pem`, "utf8"),
    true,
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
  const results = []

  try {
    await page.goto(fixture.origin)
    await page.getByRole("button", { name: "Login fixture" }).click()
    await browserExpect(page.locator("#result")).toHaveText("login:204")

    for (const [kind, type, bytes] of [
      ["audio", "audio/wav", mediaAudio],
      ["video", "video/webm", mediaVideo],
      ["file", "text/html", mediaFile],
    ] as const) {
      const uploaded = await page.evaluate(
        async ({ type, bytes }) => {
          const response = await fetch(
            "/editor/documents/tenant:browser/assets",
            {
              method: "POST",
              headers: {
                "Content-Type": type,
                "X-File-Name": "../active.html",
                "X-Editor-Request": "1",
                "X-CSRF-Token": "fixture",
              },
              body: new Uint8Array(bytes),
            },
          )

          const body: unknown = await response.json()

          return { status: response.status, body }
        },
        { type, bytes: Array.from(bytes) },
      )

      expect(uploaded.status).toBe(201)
      const { url } = z.object({ url: z.string() }).parse(uploaded.body)

      if (kind === "file") {
        await page.evaluate((url) => {
          const link = document.createElement("a")
          link.href = url
          link.textContent = "Download opaque file"
          document.body.append(link)
        }, url)
        const pending = page.waitForEvent("download")
        await page.getByRole("link", { name: "Download opaque file" }).click()
        const download = await pending
        await download.saveAs(`${artifacts}/opaque.bin`)
        expect(await readFile(`${artifacts}/opaque.bin`)).toEqual(bytes)
        expect(download.suggestedFilename()).not.toContain("../")
        expect(page.url()).toBe(`${fixture.origin}/`)
        results.push({ kind, downloaded: bytes.length })
        continue
      }

      const playback = await page.evaluate(
        async ({ kind, url }) => {
          const media = document.createElement(kind)
          media.controls = true
          media.preload = "auto"

          if (media instanceof HTMLVideoElement) {
            media.width = 320
            media.height = 240
          }

          document.body.append(media)

          const metadata = new Promise<void>((resolve, reject) => {
            media.addEventListener("loadedmetadata", () => resolve(), {
              once: true,
            })
            media.addEventListener(
              "error",
              () => reject(new Error(`decode:${media.error?.code}`)),
              { once: true },
            )
          })

          media.src = url
          await metadata

          const progress = new Promise<void>((resolve, reject) => {
            media.addEventListener("timeupdate", () => {
              if (media.currentTime > 0) resolve()
            })
            media.addEventListener(
              "error",
              () => reject(new Error("playback")),
              { once: true },
            )
          })

          const presented =
            media instanceof HTMLVideoElement
              ? new Promise<number>((resolve) =>
                  media.requestVideoFrameCallback((_now, metadata) =>
                    resolve(metadata.presentedFrames),
                  ),
                )
              : Promise.resolve(null)

          await media.play()
          await progress
          const frames = await presented
          media.pause()

          return {
            duration: media.duration,
            currentTime: media.currentTime,
            readyState: media.readyState,
            frames,
            width: media instanceof HTMLVideoElement ? media.videoWidth : null,
            height:
              media instanceof HTMLVideoElement ? media.videoHeight : null,
          }
        },
        { kind, url },
      )

      expect(playback.duration).toBeGreaterThan(0)
      expect(playback.currentTime).toBeGreaterThan(0)
      expect(playback.readyState).toBeGreaterThanOrEqual(2)

      if (kind === "video") {
        expect(playback).toMatchObject({ width: 32, height: 24 })
        expect(playback.frames).not.toBeNull()
        expect(playback.frames ?? 0).toBeGreaterThan(0)
      }

      const native = fixture.records.filter(
        (record) => record.path === url && record.dest === kind,
      )

      expect(
        native.some((record) => record.range !== null && record.status === 206),
      ).toBe(true)
      expect(
        native.every(
          (record) =>
            record.origin === null &&
            record.site === "same-origin" &&
            record.mode === "no-cors",
        ),
      ).toBe(true)

      const range = await page.evaluate(async (url) => {
        const response = await fetch(url, { headers: { Range: "bytes=1-7" } })

        return {
          status: response.status,
          bytes: Array.from(new Uint8Array(await response.arrayBuffer())),
        }
      }, url)

      expect(range).toEqual({
        status: 206,
        bytes: Array.from(bytes.subarray(1, 8)),
      })
      await page.screenshot({ path: `${artifacts}/${kind}.png`, scale: "css" })
      fixture.setPolicy("asset-deny")
      expect(
        await page.evaluate(
          async (url) =>
            (await fetch(url, { headers: { Range: "bytes=bad" } })).status,
          url,
        ),
      ).toBe(403)
      await page.reload()

      const deniedNative = await page.evaluate(
        async ({ kind, url }) => {
          const media = document.createElement(kind)
          document.body.append(media)

          const failed = new Promise<boolean>((resolve) => {
            media.addEventListener("error", () => resolve(true), { once: true })
            media.addEventListener("loadedmetadata", () => resolve(false), {
              once: true,
            })
          })

          media.src = url
          media.load()

          return await failed
        },
        { kind, url },
      )

      expect(deniedNative).toBe(true)
      fixture.setPolicy("allow")
      fixture.setExpiry(Date.now() - 1)
      expect(
        await page.evaluate(async (url) => (await fetch(url)).status, url),
      ).toBe(401)
      fixture.setExpiry(Date.now() + 60000)
      fixture.setBearerOnly(true)
      expect(
        await page.evaluate(async (url) => (await fetch(url)).status, url),
      ).toBe(401)
      fixture.setBearerOnly(false)
      results.push({ kind, playback, native, range })
    }

    await page.screenshot({ path: `${artifacts}/media.png`, scale: "css" })
    await writeFile(
      `${artifacts}/result.json`,
      JSON.stringify({ browser: browser.version(), results }, null, 2),
    )
  } finally {
    await writeFile(
      `${artifacts}/requests.json`,
      JSON.stringify(fixture.records, null, 2),
    )
    await browser.close()
    await fixture.close()
  }
}, 90000)
