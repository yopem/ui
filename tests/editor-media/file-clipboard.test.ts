import {
  getMediaClipboardKind,
  hasRichMediaClipboardType,
  isMediaClipboardFileCountAllowed,
} from "@editor/media/clipboard-model"
import { expect, test } from "bun:test"

function createFile(type: string) {
  return new File(["data"], "upload.bin", { type })
}

test("maps file MIME types to supported media kinds", () => {
  expect(getMediaClipboardKind(createFile("image/png"))).toBe("image")
  expect(getMediaClipboardKind(createFile("video/webm"))).toBe("video")
  expect(getMediaClipboardKind(createFile("audio/wav"))).toBe("audio")
  expect(getMediaClipboardKind(createFile("application/pdf"))).toBe("file")
  expect(getMediaClipboardKind(createFile(""))).toBe("file")
})

test("keeps native rich clipboard formats ahead of file uploads", () => {
  for (const type of [
    "application/x-lexical-editor",
    "text/html",
    "text/markdown",
    "text/rtf",
  ])
    expect(hasRichMediaClipboardType(["image/png", type])).toBe(true)

  expect(hasRichMediaClipboardType(["Files", "image/png", "text/plain"])).toBe(
    false,
  )
})

test("accepts only one clipboard file per insertion", () => {
  expect(isMediaClipboardFileCountAllowed(0)).toBe(false)
  expect(isMediaClipboardFileCountAllowed(1)).toBe(true)
  expect(isMediaClipboardFileCountAllowed(2)).toBe(false)
  expect(isMediaClipboardFileCountAllowed(Number.NaN)).toBe(false)
})
