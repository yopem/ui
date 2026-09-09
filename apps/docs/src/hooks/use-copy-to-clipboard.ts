"use client"

import * as React from "react"

export function useCopyToClipboard({
  timeout = 2000,
  onCopy,
}: {
  timeout?: number
  onCopy?: () => void
} = {}) {
  const [isCopied, setIsCopied] = React.useState(false)
  const [copyError, setCopyError] = React.useState<string | null>(null)
  const timeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyToClipboard = async (value: string) => {
    setCopyError(null)
    setIsCopied(false)
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error(
          "Clipboard unavailable. Select the code and copy it manually.",
        )
      }
      await navigator.clipboard.writeText(value)
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
      setIsCopied(true)
      onCopy?.()
      if (timeout !== 0) {
        timeoutIdRef.current = setTimeout(() => {
          setIsCopied(false)
          timeoutIdRef.current = null
        }, timeout)
      }
    } catch {
      setCopyError("Could not copy. Select the code and copy it manually.")
    }
  }

  React.useEffect(
    () => () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    },
    [],
  )

  return { copyToClipboard, copyError, isCopied }
}
