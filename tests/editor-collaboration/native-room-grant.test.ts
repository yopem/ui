import {
  editorNativeRoomGrantSchema,
  validateEditorNativeGrantEndpoint,
  validateEditorNativeRoomGrant,
  validateEditorNativeSignalingUrls,
  validateEditorNativeSocketUrl,
} from "@editor/collaboration-native-model"
import { expect, test } from "bun:test"

const now = 1800000000000

function grant() {
  return editorNativeRoomGrantSchema.parse({
    roomId: "workspace:shared-room",
    generation: "a".repeat(64),
    seeded: true,
    permission: "write",
    credentialExpiresAt: now + 60000,
    hocuspocusToken: "fixture-access-token",
    displayName: "First collaborator",
    cursorColor: "#3466aa",
    peer: {
      room: "trusted-room-generation-1",
      password: "host-issued-credential-12345678901234567890",
      trustedWritersOnly: true,
    },
  })
}

test("accepts an explicit seeded room grant with a bounded lifetime", () => {
  expect(
    validateEditorNativeRoomGrant(grant(), "workspace:shared-room", now),
  ).toEqual(grant())
})

test("rejects a grant for another document without changing its input", () => {
  const input = grant()
  const before = structuredClone(input)

  expect(() =>
    validateEditorNativeRoomGrant(input, "workspace:other-room", now),
  ).toThrow()
  expect(input).toEqual(before)
})

test("rejects expired and excessively long grants", () => {
  for (const credentialExpiresAt of [now - 1, now, now + 300001]) {
    expect(() =>
      validateEditorNativeRoomGrant(
        { ...grant(), credentialExpiresAt },
        "workspace:shared-room",
        now,
      ),
    ).toThrow()
  }
})

test("rejects peer transport for a read-only grant", () => {
  expect(() =>
    validateEditorNativeRoomGrant(
      { ...grant(), permission: "read" },
      "workspace:shared-room",
      now,
    ),
  ).toThrow()

  const input = { ...grant(), permission: "read" as const, peer: null }

  expect(
    validateEditorNativeRoomGrant(input, "workspace:shared-room", now),
  ).toEqual(input)
})

test("rejects missing seeding and nonliteral trusted-writer acknowledgements", () => {
  expect(
    editorNativeRoomGrantSchema.safeParse({ ...grant(), seeded: false })
      .success,
  ).toBe(false)

  expect(
    editorNativeRoomGrantSchema.safeParse({
      ...grant(),
      peer: { ...grant().peer, trustedWritersOnly: "true" },
    }).success,
  ).toBe(false)
})

test("rejects malformed identity, secrets, generations and unsafe expiries", () => {
  for (const input of [
    { ...grant(), generation: "wrong" },
    { ...grant(), hocuspocusToken: "token\nvalue" },
    { ...grant(), cursorColor: "url(https://example.invalid)" },
    { ...grant(), credentialExpiresAt: Number.POSITIVE_INFINITY },
    { ...grant(), credentialExpiresAt: Number.MAX_SAFE_INTEGER + 1 },
    { ...grant(), peer: { ...grant().peer, password: "short" } },
  ]) {
    expect(editorNativeRoomGrantSchema.safeParse(input).success).toBe(false)
  }
})

test("requires an explicit HTTPS grant endpoint on the trusted origin", () => {
  expect(
    validateEditorNativeGrantEndpoint(
      "https://editor.test/collaboration/grant",
      "https://editor.test",
    ),
  ).toBe("https://editor.test/collaboration/grant")

  for (const endpoint of [
    "http://editor.test/collaboration/grant",
    "https://attacker.test/collaboration/grant",
    "https://user:secret@editor.test/collaboration/grant",
    "https://editor.test/collaboration/grant?token=secret",
    "https://editor.test/collaboration/grant#secret",
  ]) {
    expect(() =>
      validateEditorNativeGrantEndpoint(endpoint, "https://editor.test"),
    ).toThrow()
  }
})

test("requires the Hocuspocus socket to match the trusted HTTPS origin", () => {
  expect(
    validateEditorNativeSocketUrl(
      "wss://editor.test/collaboration/socket",
      "https://editor.test",
    ),
  ).toBe("wss://editor.test/collaboration/socket")

  for (const socketUrl of [
    "ws://editor.test/collaboration/socket",
    "wss://attacker.test/collaboration/socket",
    "wss://user:secret@editor.test/collaboration/socket",
    "wss://editor.test/collaboration/socket?token=secret",
    "wss://editor.test/collaboration/socket#secret",
  ]) {
    expect(() =>
      validateEditorNativeSocketUrl(socketUrl, "https://editor.test"),
    ).toThrow()
  }
})

test("uses only explicit bounded WSS signaling endpoints", () => {
  expect(validateEditorNativeSignalingUrls(["wss://signal.test/ws"])).toEqual([
    "wss://signal.test/ws",
  ])

  for (const signaling of [
    [],
    ["https://signal.test/ws"],
    ["ws://signal.test/ws"],
    ["wss://user:secret@signal.test/ws"],
    ["wss://signal.test/ws?token=secret"],
    ["wss://signal.test/ws#secret"],
    ["wss://signal.test/ws", "wss://signal.test/ws"],
  ]) {
    expect(() => validateEditorNativeSignalingUrls(signaling)).toThrow()
  }
})
