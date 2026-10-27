import {
  EDITOR_DRAWING_MAX_ELEMENTS,
  parseEditorDrawingScene,
} from "@editor/drawing-model"
import { normalizeEditorDrawingSdkElements } from "@editor/drawing-sdk"
import { expect, test } from "bun:test"

const sdkFactoryRectangle = {
  id: "factory-rectangle",
  type: "rectangle",
  x: 24,
  y: 24,
  width: 120,
  height: 64,
  angle: 0,
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  index: null,
  roundness: null,
  seed: 1,
  version: 1,
  versionNonce: 0,
  isDeleted: false,
  boundElements: null,
  updated: 1,
  link: null,
  locked: false,
  customData: undefined,
}

test("normalizes only undefined customData from SDK element factories", () => {
  expect(Object.hasOwn(sdkFactoryRectangle, "customData")).toBe(true)
  expect(() =>
    parseEditorDrawingScene({ elements: [sdkFactoryRectangle] }),
  ).toThrow()

  const [normalized] = normalizeEditorDrawingSdkElements([sdkFactoryRectangle])

  expect(normalized).not.toHaveProperty("customData")
  expect(sdkFactoryRectangle).toHaveProperty("customData", undefined)
  expect(
    parseEditorDrawingScene({ elements: [normalized] }).elements[0],
  ).toMatchObject({ id: "factory-rectangle", type: "rectangle" })
})

test("keeps populated and null SDK customData invalid", () => {
  for (const customData of [{ owner: "local" }, null]) {
    const element = { ...sdkFactoryRectangle, customData }
    const [normalized] = normalizeEditorDrawingSdkElements([element])

    expect(normalized).toHaveProperty("customData", customData)
    expect(() => parseEditorDrawingScene({ elements: [normalized] })).toThrow()
  }
})

test("rejects oversized SDK collections before inspecting elements", () => {
  let inspected = false

  const element = new Proxy(sdkFactoryRectangle, {
    getOwnPropertyDescriptor() {
      inspected = true

      throw new Error("Element inspection must not run")
    },
  })

  expect(() =>
    normalizeEditorDrawingSdkElements(
      Array.from({ length: EDITOR_DRAWING_MAX_ELEMENTS + 1 }, () => element),
    ),
  ).toThrow("Editor drawing scene exceeds element limit")
  expect(inspected).toBe(false)
})

test("does not normalize other undefined SDK properties", () => {
  const element = { ...sdkFactoryRectangle, unsupportedOptional: undefined }
  const [normalized] = normalizeEditorDrawingSdkElements([element])

  expect(normalized).toHaveProperty("unsupportedOptional", undefined)
  expect(() => parseEditorDrawingScene({ elements: [normalized] })).toThrow()
})
