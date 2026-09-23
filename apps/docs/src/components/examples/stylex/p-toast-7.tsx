"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { Paragraph } from "@/components/ui/paragraph"
import { anchoredToastManager } from "@/components/ui/toast"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
export default function Example() {
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
          <CheckIcon
            {...stylex.props(exampleStyles.icon, exampleStyles.example1)}
          />
        ) : (
          <CopyIcon
            {...stylex.props(exampleStyles.icon, exampleStyles.example1)}
          />
        )}
      </TooltipTrigger>
      <TooltipPopup>
        <Paragraph>Copy to clipboard</Paragraph>
      </TooltipPopup>
    </Tooltip>
  )
}

const exampleStyles = stylex.create({
  icon: {
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
