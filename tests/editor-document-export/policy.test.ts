import {
  createEditorDocumentExportSnapshot,
  readEditorDocumentExportResource,
  validateEditorDocumentExportSVG,
} from "@editor/document-export-image"
import {
  assertEditorDocumentExportActive,
  assertEditorDocumentExportPNG,
  beginEditorDocumentExport,
  EditorDocumentExportError,
  editorDocumentExportLimits,
  validateEditorDocumentExportDataURL,
  validateEditorDocumentExportDimensions,
  validateEditorDocumentExportURL,
  waitForEditorDocumentExport,
  waitForEditorDocumentExportWithCleanup,
} from "@editor/document-export-model"
import { expect, test } from "bun:test"
import { DOMParser, parseHTML } from "linkedom"

function operation(signal = new AbortController().signal) {
  return {
    signal,
    deadlineAt: Date.now() + editorDocumentExportLimits.maxDurationMs,
  }
}

function deferred<Value>() {
  let resolvePromise: ((value: Value | PromiseLike<Value>) => void) | null =
    null

  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve
  })

  function resolve(value: Value | PromiseLike<Value>) {
    if (!resolvePromise) throw new Error("Deferred promise is not initialized.")
    resolvePromise(value)
  }

  return { promise, resolve }
}

async function expectRejected(
  promise: Promise<unknown>,
  code?: "aborted" | "deadline",
) {
  const error = await promise.then(
    () => {
      throw new Error("Expected the promise to reject.")
    },
    (reason) => reason,
  )

  expect(error).toBeInstanceOf(Error)

  if (code) expect(error).toMatchObject({ code })
}

function observeHTMLParser(document: Document) {
  const view = document.defaultView

  if (!view) throw new Error("The test document needs a default view.")

  const originalParser = view.DOMParser
  const inputs: string[] = []

  class ObservedDOMParser extends originalParser {
    override parseFromString(
      ...args: Parameters<
        InstanceType<typeof originalParser>["parseFromString"]
      >
    ) {
      if (args[1] === "text/html") inputs.push(args[0])

      return super.parseFromString(...args)
    }
  }

  Object.defineProperty(view, "DOMParser", {
    configurable: true,
    value: ObservedDOMParser,
  })

  return {
    inputs,
    restore() {
      Object.defineProperty(view, "DOMParser", {
        configurable: true,
        value: originalParser,
      })
    },
  }
}

test("waits reject through promises for already aborted and expired operations", async () => {
  const abortedController = new AbortController()
  abortedController.abort()
  const abortedWork = Promise.reject(new Error("late work failure"))

  const abortedWait = waitForEditorDocumentExport(
    abortedWork,
    operation(abortedController.signal),
  )

  await expectRejected(abortedWait, "aborted")

  const expired = operation()
  expired.deadlineAt = Date.now() - 1
  const expiredWork = Promise.reject(new Error("late work failure"))
  const expiredWait = waitForEditorDocumentExport(expiredWork, expired)

  await expectRejected(expiredWait, "deadline")
})

test("keeps the export slot while abandoned work remains pending", async () => {
  const controller = new AbortController()
  const lease = beginEditorDocumentExport(operation(controller.signal))
  const work = deferred<void>()
  const waiting = lease.track(waitForEditorDocumentExport(work.promise, lease))

  lease.finish()
  controller.abort()
  await expectRejected(waiting, "aborted")
  expect(() => beginEditorDocumentExport(operation())).toThrow()

  work.resolve(undefined)
  await work.promise
  const finalLease = beginEditorDocumentExport(operation())
  finalLease.finish()
})

test("disposes late snapshot results before releasing the export slot", async () => {
  const controller = new AbortController()
  const lease = beginEditorDocumentExport(operation(controller.signal))
  let disposedWhileBusy = false
  const work = deferred<{ dispose(): void }>()

  const waiting = waitForEditorDocumentExportWithCleanup(
    lease.track(work.promise),
    lease,
    (value) => value.dispose(),
  )

  lease.finish()
  controller.abort()
  await expectRejected(waiting, "aborted")
  work.resolve({
    dispose() {
      try {
        const probe = beginEditorDocumentExport(operation())
        probe.finish()
      } catch {
        disposedWhileBusy = true
      }
    },
  })
  await work.promise
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  expect(disposedWhileBusy).toBe(true)

  const finalLease = beginEditorDocumentExport(operation())
  finalLease.finish()
})

test("cancels a late resource response and holds the slot until cleanup settles", async () => {
  const { document } = parseHTML(
    "<!doctype html><html><head></head><body></body></html>",
  )

  const editorRoot = document.createElement("div")
  document.body.append(editorRoot)
  const controller = new AbortController()
  const lease = beginEditorDocumentExport(operation(controller.signal))
  const requested = deferred<void>()
  const responseWork = deferred<Response>()
  let cancelled = false
  const cancellationStarted = deferred<void>()
  const cancellation = deferred<void>()

  const exportWork = lease.track(
    createEditorDocumentExportSnapshot(
      '<img src="https://assets.example.test/image.png">',
      editorRoot,
      {
        deadlineAt: lease.deadlineAt,
        purpose: "print",
        resolveResource() {
          requested.resolve(undefined)

          return responseWork.promise
        },
        signal: lease.signal,
      },
    ),
  )

  await requested.promise
  controller.abort()
  await expectRejected(exportWork, "aborted")
  lease.finish()
  responseWork.resolve(
    new Response(
      new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true
          cancellationStarted.resolve(undefined)

          return cancellation.promise
        },
      }),
      { headers: { "content-type": "image/png" } },
    ),
  )
  await cancellationStarted.promise
  expect(cancelled).toBe(true)
  expect(() => beginEditorDocumentExport(operation())).toThrow()
  cancellation.resolve(undefined)
  await cancellation.promise
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  const finalLease = beginEditorDocumentExport(operation())
  finalLease.finish()
})

test("accepts bounded positive integer image dimensions", () => {
  expect(validateEditorDocumentExportDimensions(1280, 720)).toEqual({
    width: 1280,
    height: 720,
  })
})

const invalidDimensions: readonly (readonly [number, number])[] = [
  [0, 10],
  [-1, 10],
  [1.5, 10],
  [Number.NaN, 10],
  [10, Number.POSITIVE_INFINITY],
  [editorDocumentExportLimits.maxWidth + 1, 1],
  [1, editorDocumentExportLimits.maxHeight + 1],
  [
    editorDocumentExportLimits.maxWidth,
    Math.floor(
      editorDocumentExportLimits.maxPixels /
        editorDocumentExportLimits.maxWidth,
    ) + 1,
  ],
]

test("rejects unsafe image dimensions", () => {
  for (const [width, height] of invalidDimensions)
    expect(() =>
      validateEditorDocumentExportDimensions(width, height),
    ).toThrow()
})

test("accepts only HTTPS resource URLs without credentials, queries, or fragments", () => {
  expect(
    validateEditorDocumentExportURL(
      "https://assets.example.test/image.png",
      "https://docs.example.test/editor",
    ).href,
  ).toBe("https://assets.example.test/image.png")

  for (const value of [
    "http://assets.example.test/image.png",
    "https://user:secret@assets.example.test/image.png",
    "https://assets.example.test/image.png?token=secret",
    "https://assets.example.test/image.png?",
    "https://assets.example.test/image.png#fragment",
    "",
    "file:///private/image.png",
    "javascript:alert(1)",
  ]) {
    expect(() =>
      validateEditorDocumentExportURL(
        value,
        "https://docs.example.test/editor",
      ),
    ).toThrow()
  }
})

test("accepts bounded raster data URLs and rejects SVG or malformed payloads", () => {
  expect(
    validateEditorDocumentExportDataURL("data:image/png;base64,iVBORw0KGgo="),
  ).toMatchObject({ mediaType: "image/png" })

  for (const value of [
    "data:image/svg+xml;base64,PHN2Zy8+",
    "data:image/png,not-base64",
    "data:image/png;base64,%%%",
    `data:image/png;base64,${"A".repeat(editorDocumentExportLimits.maxResourceBytes * 2)}`,
  ]) {
    expect(() => validateEditorDocumentExportDataURL(value)).toThrow()
  }
})

test("embeds bounded raster bytes returned by the explicit resolver", async () => {
  const response = new Response(new Uint8Array([1, 2, 3]), {
    status: 200,
    headers: { "content-type": "image/png" },
  })

  const result = await readEditorDocumentExportResource(
    response,
    {
      ...operation(),
      url: new URL("https://assets.example.test/image.png"),
    },
    0,
  )

  expect(result).toEqual({
    dataURL: "data:image/png;base64,AQID",
    mediaType: "image/png",
    byteLength: 3,
  })
})

test("rejects denied, redirected, oversized, and non-raster resource responses", async () => {
  const current = operation()

  const redirect = new Response("", {
    status: 302,
    headers: {
      location: "https://other.example.test/image.png",
      "content-type": "image/png",
    },
  })

  await expectRejected(
    readEditorDocumentExportResource(
      new Response(null, { status: 403 }),
      { ...current, url: new URL("https://assets.example.test/image.png") },
      0,
    ),
  )

  await expectRejected(
    readEditorDocumentExportResource(
      new Response("<svg />", {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      }),
      { ...current, url: new URL("https://assets.example.test/image.svg") },
      0,
    ),
  )

  await expectRejected(
    readEditorDocumentExportResource(
      new Response(
        new Uint8Array(editorDocumentExportLimits.maxResourceBytes + 1),
        {
          status: 200,
          headers: {
            "content-length": String(
              editorDocumentExportLimits.maxResourceBytes + 1,
            ),
            "content-type": "image/png",
          },
        },
      ),
      { ...current, url: new URL("https://assets.example.test/large.png") },
      0,
    ),
  )

  await expectRejected(
    readEditorDocumentExportResource(
      redirect,
      { ...current, url: new URL("https://assets.example.test/redirect.png") },
      0,
    ),
  )
})

test("aborts a resource stream after host policy revocation", async () => {
  const controller = new AbortController()

  const response = new Response(
    new ReadableStream<Uint8Array>({
      pull(stream) {
        stream.enqueue(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))
        controller.abort()
        stream.close()
      },
    }),
    { headers: { "content-type": "image/png" } },
  )

  await expectRejected(
    readEditorDocumentExportResource(
      response,
      {
        ...operation(controller.signal),
        url: new URL("https://assets.example.test/image.png"),
      },
      0,
    ),
  )
})

test("cancels a pending resource reader when export aborts", async () => {
  const controller = new AbortController()
  const cancelled = deferred<void>()

  const response = new Response(
    new ReadableStream<Uint8Array>({
      cancel() {
        cancelled.resolve(undefined)
      },
    }),
    { headers: { "content-type": "image/png" } },
  )

  const resourceWork = readEditorDocumentExportResource(
    response,
    {
      ...operation(controller.signal),
      url: new URL("https://assets.example.test/image.png"),
    },
    0,
  )

  controller.abort()
  await expectRejected(resourceWork)
  await cancelled.promise
})

test("enforces aggregate resource bytes and operation deadlines", async () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

  const response = new Response(bytes, {
    status: 200,
    headers: { "content-type": "image/png" },
  })

  await expectRejected(
    readEditorDocumentExportResource(
      response,
      {
        ...operation(),
        url: new URL("https://assets.example.test/image.png"),
      },
      editorDocumentExportLimits.maxTotalResourceBytes,
    ),
  )

  const expired = operation()
  expired.deadlineAt = Date.now() - 1
  expect(() => assertEditorDocumentExportActive(expired)).toThrow()
  await expectRejected(
    waitForEditorDocumentExport(deferred<never>().promise, expired),
  )
})

test("validates encoded SVG payloads and rejects active or external content", () => {
  const parser = new DOMParser()

  const parseSVG = (source: string) => {
    const parsed = parser.parseFromString(source, "image/svg+xml")

    return {
      root: parsed.documentElement,
      createTreeWalker(whatToShow: number) {
        return parsed.createTreeWalker(parsed.documentElement, whatToShow)
      },
      querySelector(selector: string) {
        return parsed.querySelector(selector)
      },
      querySelectorAll(selector: string) {
        return parsed.querySelectorAll(selector)
      },
    }
  }

  const encode = (svg: string) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  expect(
    validateEditorDocumentExportSVG(
      encode(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><foreignObject /></svg>',
      ),
      parseSVG,
      operation(),
      { width: 1, height: 1 },
    ),
  ).toContain("<foreignObject")

  for (const svg of [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><image href="https://assets.example.test/image.png" /></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><foreignObject><img src="data:image/png;base64,AAAA" onerror="alert(1)" /></foreignObject></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1" onload="alert(1)"><foreignObject /></svg>',
    "<html></html>",
  ]) {
    expect(() =>
      validateEditorDocumentExportSVG(encode(svg), parseSVG, operation(), {
        width: 1,
        height: 1,
      }),
    ).toThrow()
  }

  const crowded = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1">',
    "<g />".repeat(editorDocumentExportLimits.maxDocumentNodes),
    "</svg>",
  ].join("")

  expect(() =>
    validateEditorDocumentExportSVG(encode(crowded), parseSVG, operation(), {
      width: 1,
      height: 1,
    }),
  ).toThrow()
})

test("validates PNG signature, MIME type, byte size, and declared dimensions", async () => {
  const payload = new Uint8Array(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL+AAAAAElFTkSuQmCC",
      "base64",
    ),
  )

  const png = new Blob([payload], { type: "image/png" })

  expect(
    await assertEditorDocumentExportPNG(png, operation(), {
      width: 1,
      height: 1,
    }),
  ).toBe(png)

  await expectRejected(
    assertEditorDocumentExportPNG(
      new Blob(["not a PNG"], { type: "image/png" }),
      operation(),
      { width: 1280, height: 720 },
    ),
  )

  await expectRejected(
    assertEditorDocumentExportPNG(
      new Blob([payload], { type: "image/jpeg" }),
      operation(),
      { width: 1280, height: 720 },
    ),
  )
})

for (const scenario of [
  {
    name: "occurrence count",
    count: editorDocumentExportLimits.maxResourceCount + 1,
    bytes: 3,
  },
  {
    name: "serialized bytes",
    count: 5,
    bytes: editorDocumentExportLimits.maxResourceBytes,
  },
]) {
  test(`cached resources still enforce ${scenario.name}`, async () => {
    const { document } = parseHTML(
      "<!doctype html><html><head></head><body></body></html>",
    )

    const editorRoot = document.createElement("div")
    document.body.append(editorRoot)
    let requests = 0

    const payload = new Uint8Array(scenario.bytes)

    const images =
      '<img src="https://assets.example.test/repeated.png">'.repeat(
        scenario.count,
      )

    const result = await createEditorDocumentExportSnapshot(
      `<!doctype html><html><head></head><body>${images}</body></html>`,
      editorRoot,
      {
        ...operation(),
        purpose: "print",
        resolveResource() {
          requests += 1

          return Promise.resolve(
            new Response(payload, { headers: { "content-type": "image/png" } }),
          )
        },
      },
    ).then(
      (snapshot) => snapshot.dispose(),
      (cause: unknown) => cause,
    )

    expect(result).toBeInstanceOf(EditorDocumentExportError)
    expect(result).toMatchObject({ code: "resource-limit" })
    expect(requests).toBe(1)
  })
}

test("rewrites image and style URLs before browser HTML parsing", async () => {
  const { document } = parseHTML(
    "<!doctype html><html><head><title>Export</title></head><body></body></html>",
  )

  const editorRoot = document.createElement("div")
  document.body.append(editorRoot)
  const parser = observeHTMLParser(document)
  const resolvedURLs: string[] = []
  const imageURL = "https://assets.example.test/image.png"
  const styleURL = "https://assets.example.test/background.png"

  try {
    await createEditorDocumentExportSnapshot(
      `<!DOCTYPE html SYSTEM "https://assets.example.test/document.dtd"><html><head><title>Export</title></head><body style="background-image: url('${styleURL}')"><img src="${imageURL}"></body></html>`,
      editorRoot,
      {
        ...operation(),
        purpose: "print",
        resolveResource(url) {
          resolvedURLs.push(url.href)

          return Promise.resolve(
            new Response(new Uint8Array([1, 2, 3]), {
              headers: { "content-type": "image/png" },
            }),
          )
        },
      },
    ).then(
      (snapshot) => snapshot.dispose(),
      () => undefined,
    )

    expect(resolvedURLs.sort()).toEqual([imageURL, styleURL].sort())
    expect(parser.inputs).toHaveLength(1)
    expect(parser.inputs[0]).not.toContain(imageURL)
    expect(parser.inputs[0]).not.toContain(styleURL)
    expect(parser.inputs[0]).not.toContain("document.dtd")
    expect(parser.inputs[0]).toContain("data:image/png;base64,AQID")
  } finally {
    parser.restore()
  }
})

test("rejects active and network-bearing HTML before browser parsing", async () => {
  for (const html of [
    '<script src="https://assets.example.test/script.js"></script>',
    '<iframe src="https://assets.example.test/frame"></iframe>',
    '<img src="data:image/png;base64,AQID" onerror="alert(1)">',
    '<img src="https://assets.example.test/image.png" srcset="https://assets.example.test/large.png 2x">',
    '<div background="https://assets.example.test/background.png"></div>',
  ]) {
    const { document } = parseHTML(
      "<!doctype html><html><head></head><body></body></html>",
    )

    const editorRoot = document.createElement("div")
    document.body.append(editorRoot)
    const parser = observeHTMLParser(document)
    let resolverCalls = 0

    try {
      const result = await createEditorDocumentExportSnapshot(
        html,
        editorRoot,
        {
          ...operation(),
          purpose: "print",
          resolveResource() {
            resolverCalls += 1

            return Promise.resolve(
              new Response(new Uint8Array([1]), {
                headers: { "content-type": "image/png" },
              }),
            )
          },
        },
      ).then(
        (snapshot) => {
          snapshot.dispose()

          return undefined
        },
        (cause: unknown) => cause,
      )

      expect(result).toBeInstanceOf(EditorDocumentExportError)
      expect(resolverCalls).toBe(0)
      expect(parser.inputs).toEqual([])
    } finally {
      parser.restore()
    }
  }
})

test("a denied resource does not reach the browser HTML parser", async () => {
  const { document } = parseHTML(
    "<!doctype html><html><head></head><body></body></html>",
  )

  const editorRoot = document.createElement("div")
  document.body.append(editorRoot)
  const parser = observeHTMLParser(document)
  let resolverCalls = 0

  try {
    const result = await createEditorDocumentExportSnapshot(
      '<img src="https://assets.example.test/denied.png">',
      editorRoot,
      {
        ...operation(),
        purpose: "print",
        resolveResource() {
          resolverCalls += 1

          return Promise.resolve(new Response(null, { status: 403 }))
        },
      },
    ).then(
      (snapshot) => {
        snapshot.dispose()

        return undefined
      },
      (cause: unknown) => cause,
    )

    expect(result).toBeInstanceOf(EditorDocumentExportError)
    expect(resolverCalls).toBe(1)
    expect(parser.inputs).toEqual([])
  } finally {
    parser.restore()
  }
})

test("contains imported layout styles and preserves MathML", async () => {
  const { document } = parseHTML(
    "<!doctype html><html><head></head><body></body></html>",
  )

  const editorRoot = document.createElement("div")
  document.body.append(editorRoot)

  const snapshot = await createEditorDocumentExportSnapshot(
    '<body style="position:fixed!important;inset:0!important;z-index:2147483647!important"><div style="position:fixed!important;inset:0!important;z-index:2147483647!important">Layout test</div><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi><mo>+</mo><mn>1</mn></math></body>',
    editorRoot,
    { ...operation(), purpose: "print" },
  )

  try {
    const css = snapshot.styles.textContent ?? ""

    expect(css).toContain("contain:layout paint!important")
    expect(css).toContain("overflow:clip!important")
    expect(css).toContain("isolation:isolate!important")
    expect(css.lastIndexOf("position:relative!important")).toBeGreaterThan(
      css.indexOf("position:fixed!important"),
    )
    expect(snapshot.root.querySelector("math")?.textContent).toBe("x+1")
    expect(snapshot.root.querySelector("div")?.textContent).toBe("Layout test")
  } finally {
    snapshot.dispose()
  }
})

test("rejects external SVG presentation URLs before browser parsing", () => {
  let parserCalls = 0

  for (const attribute of [
    'fill="url(https://assets.example.test/paint.svg#paint)"',
    'stroke="url(https://assets.example.test/stroke.svg#paint)"',
    'filter="url(https://assets.example.test/filter.svg#filter)"',
    'clip-path="url(https://assets.example.test/clip.svg#clip)"',
    'mask="url(https://assets.example.test/mask.svg#mask)"',
    'marker-start="url(https://assets.example.test/marker.svg#marker)"',
  ]) {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><path ${attribute} /></svg>`

    expect(() =>
      validateEditorDocumentExportSVG(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`,
        () => {
          parserCalls += 1
          throw new Error("The parser must not receive external SVG URLs.")
        },
        operation(),
        { width: 1, height: 1 },
      ),
    ).toThrow(EditorDocumentExportError)
  }

  expect(parserCalls).toBe(0)
})

for (const declaration of [
  '<!DOCTYPE svg SYSTEM "https://assets.example.test/external.dtd">',
  '<!DOCTYPE svg [<!ENTITY content "expanded">]>',
  '<?xml-stylesheet href="https://assets.example.test/style.css"?>',
]) {
  test(`SVG declarations reject before parsing: ${declaration}`, () => {
    let parserCalls = 0
    const source = `${declaration}<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1" />`

    expect(() =>
      validateEditorDocumentExportSVG(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`,
        () => {
          parserCalls += 1
          throw new Error("The parser must not receive declarations.")
        },
        operation(),
        { width: 1, height: 1 },
      ),
    ).toThrow(EditorDocumentExportError)
    expect(parserCalls).toBe(0)
  })
}

test("aborts stale work and keeps a concurrency slot until pending work settles", async () => {
  const controller = new AbortController()
  const lease = beginEditorDocumentExport(operation(controller.signal))
  const work = deferred<void>()
  const tracked = lease.track(work.promise)

  lease.finish()
  expect(() => beginEditorDocumentExport(operation())).toThrow()

  controller.abort()
  expect(() =>
    assertEditorDocumentExportActive(operation(controller.signal)),
  ).toThrow()
  work.resolve(undefined)
  await tracked

  const finalLease = beginEditorDocumentExport(operation())
  finalLease.finish()
})
