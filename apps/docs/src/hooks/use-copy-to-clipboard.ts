"use client"

import { useState, useSyncExternalStore } from "react"

function createCopyStatus() {
  let copied = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let notify: (() => void) | undefined

  function setCopied(value: boolean, timeout = 0) {
    clearTimeout(timer)
    copied = value
    notify?.()

    if (value && timeout !== 0 && notify) {
      timer = setTimeout(() => setCopied(false), timeout)
    }
  }

  return {
    getSnapshot: () => copied,
    setCopied,
    subscribe(this: void, callback: () => void) {
      notify = callback

      return () => {
        clearTimeout(timer)
        notify = undefined
      }
    },
  }
}

function getServerSnapshot() {
  return false
}

export function useCopyToClipboard({
  timeout = 2000,
  onCopy,
}: {
  timeout?: number
  onCopy?: () => void
} = {}) {
  const [status] = useState(createCopyStatus)

  const isCopied = useSyncExternalStore(
    status.subscribe,
    status.getSnapshot,
    getServerSnapshot,
  )

  const [copyError, setCopyError] = useState<string | null>(null)

  async function copyToClipboard(value: string) {
    setCopyError(null)
    status.setCopied(false)

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error(
          "Clipboard unavailable. Select the code and copy it manually.",
        )
      }

      await navigator.clipboard.writeText(value)
      status.setCopied(true, timeout)
      onCopy?.()
    } catch {
      setCopyError("Could not copy. Select the code and copy it manually.")
    }
  }

  return { copyToClipboard, copyError, isCopied }
}
