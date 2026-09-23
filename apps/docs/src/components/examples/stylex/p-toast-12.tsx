"use client"
import * as stylex from "@stylexjs/stylex"
import { SaveIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { Paragraph } from "@/components/ui/paragraph"
import { anchoredToastManager } from "@/components/ui/toast"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"
const ANCHORED_SAVE_TOAST_ID = "coss-example-anchored-save-toast"

function SaveTooltipPopup() {
  return (
    <TooltipPopup>
      <Paragraph>Save</Paragraph>
    </TooltipPopup>
  )
}

export default function Example() {
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const toastTimeout = 2000

  function handleSave() {
    if (!saveButtonRef.current) return
    anchoredToastManager.add({
      data: {
        tooltipStyle: true,
      },
      id: ANCHORED_SAVE_TOAST_ID,
      positionerProps: {
        anchor: saveButtonRef.current,
        sideOffset: 6,
      },
      timeout: toastTimeout,
      title: "Draft saved",
    })
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <Button
            aria-label="Save"
            onClick={handleSave}
            ref={saveButtonRef}
            size="icon"
            variant="outline"
          />
        }
      >
        <SaveIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
      </TooltipTrigger>
      <SaveTooltipPopup />
    </Tooltip>
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
