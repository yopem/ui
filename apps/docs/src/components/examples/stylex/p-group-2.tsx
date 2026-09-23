"use client"

import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"
import { Input } from "@/components/ui/input"
import { Paragraph } from "@/components/ui/paragraph"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
export default function Example() {
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
            <CheckIcon {...stylex.props(exampleStyles.icon)} />
          ) : (
            <CopyIcon {...stylex.props(exampleStyles.icon)} />
          )}
        </TooltipTrigger>
        <TooltipPopup>
          <Paragraph>Copy to clipboard</Paragraph>
        </TooltipPopup>
      </Tooltip>
    </Group>
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
})
