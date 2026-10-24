import { createMediaUpload } from "@editor/media/upload"
import { expect, test } from "bun:test"

const url = "https://example.com/image.png"

function createFile() {
  return new File(["image"], "image.png", { type: "image/png" })
}

test("host uploads validate results and clamp progress", async () => {
  const task = createMediaUpload()
  const progress: number[] = []

  const unsubscribe = task.subscribe(() => {
    progress.push(task.getSnapshot().progress)
  })

  const result = await task.start(createFile(), "image", (_file, context) => {
    expect(context.signal.aborted).toBe(false)
    context.onProgress(-10)
    context.onProgress(45)
    context.onProgress(120)
    context.onProgress(Number.POSITIVE_INFINITY)

    return Promise.resolve(url)
  })

  expect(result?.url).toBe(url)
  expect(task.getSnapshot()).toMatchObject({
    status: "success",
    progress: 100,
  })
  expect(progress).toContain(45)
  expect(progress).toContain(100)
  unsubscribe()
})

test("failed and unsafe host responses never report success", async () => {
  const task = createMediaUpload()

  await task.start(createFile(), "file", () =>
    Promise.resolve("data:text/html,bad"),
  )
  expect(task.getSnapshot().status).toBe("error")

  await task.start(createFile(), "file", () =>
    Promise.reject(new Error("upload failed")),
  )
  expect(task.getSnapshot().status).toBe("error")
})

test("cancel ignores late progress and completion", async () => {
  const task = createMediaUpload()
  let finish: ((value: string) => void) | undefined
  let reportProgress: ((percent: number) => void) | undefined
  let signal: AbortSignal | undefined

  const pending = task.start(createFile(), "image", (_file, context) => {
    signal = context.signal
    reportProgress = context.onProgress

    return new Promise<string>((resolve) => {
      finish = resolve
    })
  })

  task.cancel()
  reportProgress?.(80)
  finish?.(url)
  await pending

  expect(signal?.aborted).toBe(true)
  expect(task.getSnapshot()).toMatchObject({
    status: "cancelled",
    progress: 0,
    result: null,
  })
})

test("reset aborts prior work and removes stale upload state", async () => {
  const task = createMediaUpload()
  let finish: ((value: string) => void) | undefined
  let signal: AbortSignal | undefined

  const pending = task.start(createFile(), "image", (_file, context) => {
    signal = context.signal

    return new Promise<string>((resolve) => {
      finish = resolve
    })
  })

  task.reset()
  finish?.(url)
  await pending

  expect(signal?.aborted).toBe(true)
  expect(task.getSnapshot()).toMatchObject({
    status: "idle",
    progress: 0,
    result: null,
  })
})
