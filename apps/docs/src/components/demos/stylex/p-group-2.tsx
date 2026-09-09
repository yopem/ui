"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export default function Particle() {
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Group aria-label="Url input">
      <Input
        aria-label="Url"
        defaultValue="https://coss.com"
        ref={inputRef}
        type="text"
        controlXstyle={groupItemStyles.item}
      />
      <GroupSeparator />
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
              size="icon"
              variant="outline"
              xstyle={groupItemStyles.item}
            />
          }
        >
          {isCopied ? (
            <CheckIcon {...stylex.props(demoStyles.icon)} />
          ) : (
            <CopyIcon {...stylex.props(demoStyles.icon)} />
          )}
        </TooltipTrigger>
        <TooltipPopup>
          <p>Copy to clipboard</p>
        </TooltipPopup>
      </Tooltip>
    </Group>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})
