import type { Page } from "@playwright/test"

export const mediaOrigin = "https://media.test"

export async function routeMediaResources(page: Page) {
  await page.goto("/editor/media-insert-control")

  const video = await page.evaluate(async () => {
    const canvas = document.createElement("canvas")
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext("2d")

    if (!context) throw new Error("Missing canvas context")
    context.fillRect(0, 0, 32, 32)
    const stream = canvas.captureStream(10)

    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    })

    const chunks: Blob[] = []

    const recording = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => chunks.push(event.data)
      recorder.onerror = () =>
        reject(new Error("Media fixture recording failed"))
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }))
    })

    recorder.start()
    await new Promise((resolve) => setTimeout(resolve, 300))
    recorder.stop()
    const blob = await recording

    for (const track of stream.getTracks()) track.stop()

    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })

  const samples = 8000
  const audio = Buffer.alloc(44 + samples * 2)
  audio.write("RIFF", 0)
  audio.writeUInt32LE(audio.length - 8, 4)
  audio.write("WAVEfmt ", 8)
  audio.writeUInt32LE(16, 16)
  audio.writeUInt16LE(1, 20)
  audio.writeUInt16LE(1, 22)
  audio.writeUInt32LE(samples, 24)
  audio.writeUInt32LE(samples * 2, 28)
  audio.writeUInt16LE(2, 32)
  audio.writeUInt16LE(16, 34)
  audio.write("data", 36)
  audio.writeUInt32LE(samples * 2, 40)

  await page.route(`${mediaOrigin}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname

    const resources = new Map([
      [
        "/image.svg",
        {
          contentType: "image/svg+xml",
          body: Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="black"/></svg>',
          ),
        },
      ],
      ["/video.webm", { contentType: "video/webm", body: Buffer.from(video) }],
      ["/audio.wav", { contentType: "audio/wav", body: audio }],
      [
        "/file.txt",
        { contentType: "text/plain", body: Buffer.from("Media fixture\n") },
      ],
    ])

    const resource = resources.get(path)

    await route.fulfill(
      resource
        ? { ...resource, headers: { "access-control-allow-origin": "*" } }
        : { status: 404 },
    )
  })
  await page.route(
    "https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg",
    (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="black"/></svg>',
      }),
  )
  await page.route("https://player.vimeo.com/video/123456", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en"><head><title>Embedded fixture</title></head><body><main><p>Embedded fixture</p></main></body></html>',
    }),
  )
}
