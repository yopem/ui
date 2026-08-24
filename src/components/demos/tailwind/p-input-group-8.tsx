"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/tailwind/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tailwind/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export default function Particle() {
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
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </TooltipTrigger>
          <TooltipPopup>
            <p>Copy to clipboard</p>
          </TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}
