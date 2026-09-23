"use client"

import * as stylex from "@stylexjs/stylex"
import { DownloadIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  groupItemStyles,
  Group,
  GroupSeparator,
  GroupText,
} from "@/components/ui/group"
import { Spinner } from "@/components/ui/spinner"
import { toastManager } from "@/components/ui/toast"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
export default function Example() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const infoToastIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isDownloading) return

    const interval = setInterval(() => {
      setProgress((prev) =>
        Math.min(99, prev + Math.round(Math.random() * 8 + 2)),
      )
    }, 300)

    return () => clearInterval(interval)
  }, [isDownloading])

  async function handleDownload() {
    if (isDownloading) return

    setIsDownloading(true)
    setProgress(0)
    abortControllerRef.current = new AbortController()

    infoToastIdRef.current = toastManager.add({
      description: "Your download will begin once ready.",
      title: "Generating report…",
      type: "info",
    })

    try {
      await new Promise<string>((resolve, reject) => {
        const shouldSucceed = Math.random() > 0.2
        const timeoutId = setTimeout(() => {
          if (shouldSucceed) {
            resolve("Download complete")
          } else {
            reject(new Error("Download failed"))
          }
        }, 4000)

        abortControllerRef.current?.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId)
          reject(new DOMException("Cancelled", "AbortError"))
        })
      })
    } catch (err) {
      // Close info toast before showing error
      if (infoToastIdRef.current) {
        toastManager.close(infoToastIdRef.current)
        infoToastIdRef.current = null
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        // Cancelled
        toastManager.add({
          description: "Report generation was cancelled.",
          title: "Cancelled",
          type: "error",
        })
      } else {
        // Other errors
        toastManager.add({
          description: "Please try again later.",
          title: "Failed to generate report",
          type: "error",
        })
      }
    } finally {
      setIsDownloading(false)
      setProgress(0)
      abortControllerRef.current = null
      infoToastIdRef.current = null
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort()
  }

  return (
    <TooltipProvider delay={0}>
      {isDownloading ? (
        <Group>
          <GroupText
            aria-live="polite"
            {...stylex.props(exampleStyles.example1)}
            render={<Box as="output" />}
          >
            <Spinner {...stylex.props(exampleStyles.icon)} />
            <Box
              as="span"
              aria-hidden="true"
              {...stylex.props(exampleStyles.example2)}
            >
              {progress.toString().padStart(2, "\u2007")}%
            </Box>
            <Box as="span" {...stylex.props(exampleStyles.example3)}>
              Generating report, {progress}% complete
            </Box>
          </GroupText>
          <GroupSeparator />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  xstyle={groupItemStyles.item}
                  aria-label="Cancel download"
                  onClick={handleCancel}
                  size="icon"
                  variant="outline"
                />
              }
            >
              <XIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
            </TooltipTrigger>
            <TooltipPopup>Cancel</TooltipPopup>
          </Tooltip>
        </Group>
      ) : (
        <Button onClick={handleDownload} variant="outline">
          <DownloadIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
          Download
        </Button>
      )}
    </TooltipProvider>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    cursor: "default",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    fontWeight: "500",
    color: "var(--foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  example3: {
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
})
