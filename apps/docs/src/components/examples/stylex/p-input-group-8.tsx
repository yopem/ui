"use client"
import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
export default function Example() {
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Url"
        defaultValue="https://coss.com"
        ref={inputRef}
        type="text"
      />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Copy"
                onClick={() => {
                  if (inputRef.current) {
                    copyToClipboard(inputRef.current.value)
                  }
                }}
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            {isCopied ? (
              <CheckIcon {...stylex.props(exampleStyles.icon)} />
            ) : (
              <CopyIcon {...stylex.props(exampleStyles.icon)} />
            )}
          </TooltipTrigger>
          <TooltipPopup>
            <Paragraph>Copy to clipboard</Paragraph>
          </TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})
