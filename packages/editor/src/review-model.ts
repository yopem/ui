import { z } from "zod"

import type { EditorReviewAuthor } from "./review-codecs"

import { reviewAuthorSchema, reviewIdSchema } from "./review-codecs"

const reviewActionSchema = z.enum([
  "create",
  "reply",
  "edit",
  "delete",
  "resolve",
  "reopen",
  "suggest",
  "accept",
  "reject",
  "undo",
  "redo",
])

export type EditorReviewAction = z.infer<typeof reviewActionSchema>

export interface EditorReviewHost {
  readonly viewer: EditorReviewAuthor | null
  readonly visible: boolean
  readonly replyWhileReadonly: boolean
  readonly can: (
    action: EditorReviewAction,
    targetId: string | undefined,
    viewer: Readonly<EditorReviewAuthor>,
  ) => boolean
}

export function createReviewSession() {
  let host: EditorReviewHost | null = null
  let epoch = 0
  let disposed = false

  function replace(next: EditorReviewHost | null) {
    if (disposed) throw new Error("Review session is disposed.")

    host = null
    epoch++

    if (next === null) return
    const visible = z.boolean().parse(next.visible)
    const replyWhileReadonly = z.boolean().parse(next.replyWhileReadonly)

    const viewer =
      next.viewer === null ? null : reviewAuthorSchema.parse(next.viewer)

    const can = next.can

    if (!z.function().safeParse(can).success)
      throw new Error("Review requires a host policy callback.")
    host = Object.freeze({ viewer, visible, replyWhileReadonly, can })
  }

  function authorize<Input>(input: Input, targetId?: string) {
    const action = reviewActionSchema.parse(input)

    if (disposed || !host?.viewer)
      throw new Error("Review requires a host viewer.")

    if (targetId !== undefined) reviewIdSchema.parse(targetId)
    const version = epoch
    const currentHost = host
    const author = Object.freeze(reviewAuthorSchema.parse(host.viewer))
    const allowed = currentHost.can(action, targetId, author)

    function assertCurrent() {
      if (disposed || version !== epoch || currentHost !== host)
        throw new Error("Review authorization expired.")
    }

    assertCurrent()

    if (allowed !== true) throw new Error("Review action denied.")

    return { author, assertCurrent }
  }

  function getHost() {
    return host
  }

  function dispose() {
    host = null
    epoch++
    disposed = true
  }

  return { replace, authorize, getHost, dispose }
}
