"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
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
            />
          }
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </TooltipTrigger>
        <TooltipPopup>
          <p>Copy to clipboard</p>
        </TooltipPopup>
      </Tooltip>
    </Group>
  )
}
