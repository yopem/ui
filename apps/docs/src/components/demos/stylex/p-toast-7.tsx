"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/stylex/button"
import { anchoredToastManager } from "@/components/ui/stylex/toast"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export default function Particle() {
  const copyButtonRef = useRef<HTMLButtonElement>(null)
  const toastTimeout = 2000

  const { copyToClipboard, isCopied } = useCopyToClipboard({
    onCopy: () => {
      if (copyButtonRef.current) {
        anchoredToastManager.add({
          data: {
            tooltipStyle: true,
          },
          positionerProps: {
            anchor: copyButtonRef.current,
          },
          timeout: toastTimeout,
          title: "Copied!",
        })
      }
    },
    timeout: toastTimeout,
  })

  function handleCopy() {
    const url = "https://coss.com"
    copyToClipboard(url)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label="Copy link"
            disabled={isCopied}
            onClick={handleCopy}
            ref={copyButtonRef}
            size="icon"
            variant="outline"
          />
        }
      >
        {isCopied ? (
          <CheckIcon {...stylex.props(demoStyles.icon, demoStyles.demo1)} />
        ) : (
          <CopyIcon {...stylex.props(demoStyles.icon, demoStyles.demo1)} />
        )}
      </TooltipTrigger>
      <TooltipPopup>
        <p>Copy to clipboard</p>
      </TooltipPopup>
    </Tooltip>
  )
}

const demoStyles = stylex.create({
  icon: {
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
