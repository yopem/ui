import type { MediaData, MediaKind } from "./schema"

import { parseMedia } from "./schema"

export type MediaUpload = (
  file: File,
  context: {
    kind: Exclude<MediaKind, "embed">
    signal: AbortSignal
    onProgress: (percent: number) => void
  },
) => Promise<string>

export interface MediaUploadSnapshot {
  status: "idle" | "uploading" | "success" | "error" | "cancelled"
  progress: number
  result: MediaData | null
}

export function createMediaUpload() {
  let controller: AbortController | undefined

  let snapshot: MediaUploadSnapshot = {
    status: "idle",
    progress: 0,
    result: null,
  }

  const listeners = new Set<() => void>()

  function publish(next: MediaUploadSnapshot) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  function cancel() {
    if (!controller) return
    const active = controller
    controller = undefined
    active.abort()
    publish({ status: "cancelled", progress: 0, result: null })
  }

  function reset() {
    controller?.abort()
    controller = undefined
    publish({ status: "idle", progress: 0, result: null })
  }

  return {
    cancel,
    reset,
    getSnapshot(this: void) {
      return snapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    async start(
      file: File,
      kind: Exclude<MediaKind, "embed">,
      upload: MediaUpload,
    ) {
      controller?.abort()
      const active = new AbortController()
      controller = active
      publish({ status: "uploading", progress: 0, result: null })

      try {
        const url = await upload(file, {
          kind,
          signal: active.signal,
          onProgress(percent) {
            if (
              controller === active &&
              !active.signal.aborted &&
              Number.isFinite(percent)
            )
              publish({
                ...snapshot,
                progress: Math.max(0, Math.min(100, percent)),
              })
          },
        })

        if (controller !== active || active.signal.aborted) return null
        const result = parseMedia({ kind, url, name: file.name })
        publish({ status: "success", progress: 100, result })

        return result
      } catch {
        if (controller === active && !active.signal.aborted)
          publish({ status: "error", progress: 0, result: null })

        return null
      } finally {
        if (controller === active) controller = undefined
      }
    },
  }
}
