import { z } from "zod"

const roomIdSchema = z
  .string()
  .max(256)
  .regex(/^[A-Za-z0-9_-]+:[A-Za-z0-9_:-]+$/)

const secretSchema = z
  .string()
  .max(16384)
  .regex(/^[\x21-\x7e]+$/)

export const editorNativeRoomGrantSchema = z.strictObject({
  roomId: roomIdSchema,
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  seeded: z.literal(true),
  permission: z.enum(["read", "write"]),
  credentialExpiresAt: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  hocuspocusToken: secretSchema.min(1),
  displayName: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[^\p{Cc}]+$/u),
  cursorColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  peer: z
    .strictObject({
      room: z
        .string()
        .min(1)
        .max(256)
        .regex(/^[A-Za-z0-9:_-]+$/),
      password: secretSchema.min(32).max(256),
      trustedWritersOnly: z.literal(true),
    })
    .nullable(),
})

export type EditorNativeRoomGrant = z.infer<typeof editorNativeRoomGrantSchema>

export function validateEditorNativeRoomGrant(
  input: EditorNativeRoomGrant,
  roomId: string,
  now = Date.now(),
) {
  const grant = editorNativeRoomGrantSchema.parse(input)

  if (
    !Number.isSafeInteger(now) ||
    now < 0 ||
    grant.roomId !== roomId ||
    grant.credentialExpiresAt <= now ||
    grant.credentialExpiresAt - now > 300000 ||
    (grant.peer !== null && grant.permission !== "write")
  )
    throw new Error("native collaboration room grant rejected")

  return grant
}

function trustedOrigin(input: string) {
  if (input.length > 512)
    throw new Error("native collaboration trusted origin rejected")
  const url = new URL(input)

  if (
    url.protocol !== "https:" ||
    url.origin !== input ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("native collaboration trusted origin rejected")

  return url.origin
}

export function validateEditorNativeGrantEndpoint(
  input: string,
  originInput: string,
) {
  if (input.length > 2048)
    throw new Error("native collaboration grant endpoint rejected")
  const origin = trustedOrigin(originInput)
  const url = new URL(input)

  if (
    url.protocol !== "https:" ||
    url.origin !== origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("native collaboration grant endpoint rejected")

  return url.href
}

export function validateEditorNativeSocketUrl(
  input: string,
  originInput: string,
) {
  if (input.length > 2048)
    throw new Error("native collaboration socket URL rejected")
  const origin = trustedOrigin(originInput)
  const url = new URL(input)
  const secureOrigin = new URL(url.href)
  secureOrigin.protocol = "https:"

  if (
    url.protocol !== "wss:" ||
    secureOrigin.origin !== origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("native collaboration socket URL rejected")

  return url.href
}

export function validateEditorNativeSignalingUrls(input: readonly string[]) {
  const urls = z.array(z.string().min(1).max(2048)).min(1).max(8).parse(input)

  const validated = urls.map((value) => {
    const url = new URL(value)

    if (
      url.protocol !== "wss:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("native collaboration signaling URL rejected")

    return url.href
  })

  if (new Set(validated).size !== validated.length)
    throw new Error("native collaboration signaling URL rejected")

  return validated
}
