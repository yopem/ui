"use client"
import * as stylex from "@stylexjs/stylex"
import { BookmarkIcon } from "lucide-react"
import { useRef, useState } from "react"

import { anchoredToastManager } from "@/components/ui/stylex/toast"
import { Toggle } from "@/components/ui/stylex/toggle"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  const [bookmarked, setBookmarked] = useState(false)
  const toggleRef = useRef<HTMLDivElement>(null)
  const toastIdRef = useRef<string | null>(null)
  const toastTimeout = 2000

  function handleToggleChange(pressed: boolean) {
    setBookmarked(pressed)

    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current)
      toastIdRef.current = null
    }

    if (pressed && toggleRef.current) {
      toastIdRef.current = anchoredToastManager.add({
        data: {
          tooltipStyle: true,
        },
        positionerProps: {
          anchor: toggleRef.current,
        },
        timeout: toastTimeout,
        title: "Bookmarked!",
        type: "success",
      })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div ref={toggleRef}>
            <Toggle
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark this"}
              onPressedChange={handleToggleChange}
              pressed={bookmarked}
            >
              <BookmarkIcon
                {...stylex.props(demoStyles.icon)}
                aria-hidden="true"
              />
            </Toggle>
          </div>
        }
      />
      <TooltipPopup>
        <p>{bookmarked ? "Remove bookmark" : "Bookmark this"}</p>
      </TooltipPopup>
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
  },
})
