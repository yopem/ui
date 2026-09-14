"use client"
import * as stylex from "@stylexjs/stylex"
import { SaveIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/stylex/button"
import { anchoredToastManager } from "@/components/ui/stylex/toast"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

const ANCHORED_SAVE_TOAST_ID = "coss-demo-anchored-save-toast"

function SaveTooltipPopup() {
  return (
    <TooltipPopup>
      <p>Save</p>
    </TooltipPopup>
  )
}

export default function Particle() {
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
        <SaveIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
      </TooltipTrigger>
      <SaveTooltipPopup />
    </Tooltip>
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
