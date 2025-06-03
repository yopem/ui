"use client"

import * as React from "react"

export function useCallbackRef<T extends (...args: unknown[]) => unknown>(
  callback: T | undefined,
  deps: readonly unknown[] = [],
): T {
  const callbackRef = React.useRef(callback)

  React.useEffect(() => {
    callbackRef.current = callback
  })

  return React.useCallback(
    ((...args: Parameters<T>) => callbackRef.current?.(...args)) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps],
  )
}
