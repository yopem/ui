import { preflightUpdate } from "@editor/server/collaboration/preflight"
import { candidateState } from "@editor/server/collaboration/protocol"
import { expect, test } from "bun:test"
import * as encoding from "lib0/encoding"
import * as Y from "yjs"

function bytes(values: number[]) {
  const encoder = encoding.createEncoder()

  for (const value of values) encoding.writeVarUint(encoder, value)

  return encoding.toUint8Array(encoder)
}

test("preflight accepts bounded V1 text, maps, arrays and XML", () => {
  const doc = new Y.Doc()
  doc.getText("text").insert(0, "saved Ω😀", { bold: true })
  doc.getText("text").insertEmbed(0, { image: "bounded" })
  doc.getMap("map").set("nested", { a: [1, true, "text"] })
  doc.getArray("list").push([new Y.Map()])
  doc.getXmlFragment("xml").insert(0, [new Y.XmlElement("p")])
  const update = Y.encodeStateAsUpdate(doc)
  expect(() => preflightUpdate(update)).not.toThrow()
  expect(
    candidateState(new Uint8Array([0, 0]), update).byteLength,
  ).toBeGreaterThan(2)
  doc.destroy()
})

test("preflight rejects declared allocations, unsafe lengths, unknown content and missing dependencies", () => {
  for (const input of [
    bytes([33]),
    bytes([1, 4294967295, 1, 0]),
    bytes([1, 1, 1, 0, 0, 4294967295]),
    bytes([0, 1, 1, 4294967295]),
    bytes([1, 1, 1, 0, 31]),
  ]) {
    expect(() => preflightUpdate(input)).toThrow()
  }

  const doc = new Y.Doc()
  doc.getText("text").insert(0, "first")
  const vector = Y.encodeStateVector(doc)
  doc.getText("text").insert(5, "second")
  const missing = Y.encodeStateAsUpdate(doc, vector)
  expect(() => candidateState(new Uint8Array([0, 0]), missing)).toThrow()
  doc.destroy()
})

test("preflight rejects deeply nested values and subdocuments before Yjs", () => {
  const doc = new Y.Doc()

  type Nested = null | Nested[]

  let value: Nested = null

  for (let index = 0; index < 100; index++) value = [value]
  doc.getMap("map").set("deep", value)
  expect(() => preflightUpdate(Y.encodeStateAsUpdate(doc))).toThrow()
  const subdoc = new Y.Doc()
  doc.getMap("map").set("subdoc", subdoc)
  expect(() => preflightUpdate(Y.encodeStateAsUpdate(doc))).toThrow()
  doc.destroy()
})

test("preflight bounds JSON embeds and formats before their Yjs decoder", () => {
  type Nested = null | Nested[]

  let nested: Nested = null

  for (let index = 0; index < 100; index++) nested = [nested]

  for (const kind of ["embed", "format"]) {
    const doc = new Y.Doc()

    if (kind === "embed") doc.getText("text").insertEmbed(0, { nested })
    else doc.getText("text").insert(0, "text", { nested })
    expect(() => preflightUpdate(Y.encodeStateAsUpdate(doc))).toThrow()
    doc.destroy()
  }
})
