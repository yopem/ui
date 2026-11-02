import { editorDiagramSvgToPng } from "@editor/diagram-png"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { describe, expect, test } from "bun:test"

const safeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><rect width="240" height="80"/></svg>'

interface EnvironmentOptions {
  imageWidth?: number
  imageHeight?: number
  loadImage?: boolean
  output?: Blob | null
  expireTimeout?: boolean
}

interface PngTestImage {
  onload: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  naturalWidth: number
  naturalHeight: number
}

interface PngTestEnvironment {
  document: Document
  objectUrls: string[]
  revokedUrls: string[]
  images: PngTestImage[]
  canvas: HTMLCanvasElement
  encodedDimensions: { width: number; height: number }[]
  clearedTimers: number[]
  getDrawCalls(): number
  expireTimeout(): void
}

function withPngEnvironment<Result>(
  options: EnvironmentOptions,
  run: (environment: PngTestEnvironment) => Result,
) {
  return withDOM((window) => {
    const document = window.document
    const objectUrls: string[] = []
    const revokedUrls: string[] = []
    const images: PngTestImage[] = []
    const encodedDimensions: { width: number; height: number }[] = []
    const clearedTimers: number[] = []
    let drawCalls = 0
    let nextTimer = 0
    let timeoutHandler: (() => void) | undefined

    class TestImage {
      onload: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      naturalWidth = options.imageWidth ?? 240
      naturalHeight = options.imageHeight ?? 80

      constructor() {
        images.push(this)
      }

      set src(_value: string) {
        if (options.loadImage === false) return
        this.onload?.(new Event("load"))
      }
    }

    const canvas = document.createElement("canvas")
    const createElement = document.createElement.bind(document)

    Reflect.set(window, "Image", TestImage)
    Reflect.set(window, "Blob", Blob)
    Reflect.set(window, "URL", {
      createObjectURL(blob: Blob) {
        const url = `blob:diagram-${objectUrls.length + 1}`
        objectUrls.push(url)
        expect(blob.type).toBe("image/svg+xml;charset=utf-8")

        return url
      },
      revokeObjectURL(url: string) {
        revokedUrls.push(url)
      },
    })
    Reflect.set(document, "createElement", (tagName: string) => {
      if (tagName.toLowerCase() === "canvas") return canvas

      return createElement(tagName)
    })
    Reflect.set(canvas, "getContext", () => ({
      drawImage() {
        drawCalls += 1
      },
    }))
    Reflect.set(canvas, "toBlob", (callback: BlobCallback) => {
      encodedDimensions.push({ width: canvas.width, height: canvas.height })
      callback(
        options.output === undefined
          ? new Blob(["png"], { type: "image/png" })
          : options.output,
      )
    })
    Reflect.set(window, "setTimeout", (callback: () => void) => {
      const timer = ++nextTimer

      if (options.expireTimeout) timeoutHandler = callback

      return timer
    })
    Reflect.set(window, "clearTimeout", (timer: number) => {
      clearedTimers.push(timer)
    })

    return run({
      document,
      objectUrls,
      revokedUrls,
      images,
      canvas,
      encodedDimensions,
      clearedTimers,
      getDrawCalls() {
        return drawCalls
      },
      expireTimeout() {
        if (!timeoutHandler) throw new Error("PNG timeout is not pending.")

        timeoutHandler()
      },
    })
  })
}

async function expectRejected(pending: Promise<unknown>) {
  const rejected = await pending.then(
    () => false,
    () => true,
  )

  expect(rejected).toBe(true)
}

describe("editor diagram PNG conversion", () => {
  test("rasterizes current sanitized SVG within bounded dimensions and cleans up", async () => {
    const controller = new AbortController()

    const result = withPngEnvironment({}, (environment) => ({
      pending: editorDiagramSvgToPng(
        environment.document,
        safeSvg,
        controller.signal,
      ),
      environment,
    }))

    const blob = await result.pending

    expect(blob.type).toBe("image/png")
    expect(blob.size).toBeGreaterThan(0)
    expect(result.environment.encodedDimensions).toEqual([
      { width: 240, height: 80 },
    ])
    expect(result.environment.getDrawCalls()).toBe(1)
    expect(result.environment.objectUrls).toEqual(["blob:diagram-1"])
    expect(result.environment.revokedUrls).toEqual(
      result.environment.objectUrls,
    )
    expect(result.environment.images[0]?.onload).toBeNull()
    expect(result.environment.images[0]?.onerror).toBeNull()
    expect(result.environment.canvas.width).toBe(0)
    expect(result.environment.canvas.height).toBe(0)
    expect(result.environment.clearedTimers).toEqual([1])
  })

  test("rejects external SVG references before creating an object URL", async () => {
    const externalReferences = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><use href="https://outside.invalid/shape.svg#shape"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect style="fill:url(https://outside.invalid/fill.svg#paint)"/></svg>',
    ]

    const result = withPngEnvironment({}, (environment) => ({
      environment,
      pending: externalReferences.map((svg) =>
        editorDiagramSvgToPng(
          environment.document,
          svg,
          new AbortController().signal,
        ),
      ),
    }))

    for (const pending of result.pending) await expectRejected(pending)

    expect(result.environment.objectUrls).toHaveLength(0)
  })

  test("rejects oversized canvas dimensions and output blobs", async () => {
    for (const [imageWidth, imageHeight] of [
      [4097, 1],
      [4096, 4097],
      [1, 16_385],
    ] as const) {
      const oversizedCanvas = withPngEnvironment(
        { imageWidth, imageHeight },
        (environment) => ({
          environment,
          pending: editorDiagramSvgToPng(
            environment.document,
            safeSvg,
            new AbortController().signal,
          ),
        }),
      )

      await expectRejected(oversizedCanvas.pending)
      expect(oversizedCanvas.environment.encodedDimensions).toHaveLength(0)
      expect(oversizedCanvas.environment.revokedUrls).toEqual(
        oversizedCanvas.environment.objectUrls,
      )
    }

    const oversizedOutput = withPngEnvironment(
      {
        output: new Blob([new Uint8Array(16_777_217)], {
          type: "image/png",
        }),
      },
      (environment) => ({
        environment,
        pending: editorDiagramSvgToPng(
          environment.document,
          safeSvg,
          new AbortController().signal,
        ),
      }),
    )

    await expectRejected(oversizedOutput.pending)
    expect(oversizedOutput.environment.revokedUrls).toEqual(
      oversizedOutput.environment.objectUrls,
    )
  })

  test("observes pre-aborted rejection and cleans up pending work on abort or timeout", async () => {
    const preAbortedController = new AbortController()
    preAbortedController.abort()

    const preAborted = withPngEnvironment({}, (environment) => ({
      environment,
      pending: editorDiagramSvgToPng(
        environment.document,
        safeSvg,
        preAbortedController.signal,
      ),
    }))

    await expectRejected(preAborted.pending)
    expect(preAborted.environment.objectUrls).toHaveLength(0)

    const controller = new AbortController()

    const pending = withPngEnvironment({ loadImage: false }, (environment) => {
      const conversion = editorDiagramSvgToPng(
        environment.document,
        safeSvg,
        controller.signal,
      )

      controller.abort()

      return { environment, pending: conversion }
    })

    await expectRejected(pending.pending)
    expect(pending.environment.revokedUrls).toEqual(
      pending.environment.objectUrls,
    )
    expect(pending.environment.images[0]?.onload).toBeNull()
    expect(pending.environment.images[0]?.onerror).toBeNull()
    expect(pending.environment.clearedTimers).toEqual([1])

    const timedOut = withPngEnvironment(
      { loadImage: false, expireTimeout: true },
      (environment) => {
        const conversion = editorDiagramSvgToPng(
          environment.document,
          safeSvg,
          new AbortController().signal,
        )

        environment.expireTimeout()

        return { environment, pending: conversion }
      },
    )

    await expectRejected(timedOut.pending)
    expect(timedOut.environment.revokedUrls).toEqual(
      timedOut.environment.objectUrls,
    )
    expect(timedOut.environment.clearedTimers).toEqual([1])
  })
})
