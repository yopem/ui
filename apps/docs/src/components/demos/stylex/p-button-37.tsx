"use client"

import * as stylex from "@stylexjs/stylex"
import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  const [open, setOpen] = useState(false)

  return (
    <Button
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={() => setOpen((prevState) => !prevState)}
      {...stylex.props(demoStyles.button)}
      size="icon"
      variant="outline"
    >
      <PlusIcon
        aria-hidden="true"
        {...stylex.props(
          demoStyles.report1,
          demoStyles.report1Manual,
          open && demoStyles.open,
        )}
      />
    </Button>
  )
}

const demoStyles = stylex.create({
  button: {
    "--button-inner-radius": "9999px",
    borderRadius: "9999px",
  },
  report1: {
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "500ms",
  },
  report1Manual: {
    transitionTimingFunction: "cubic-bezier(0.68,-0.6,0.32,1.6)",
  },
  open: {
    transform: "rotate(135deg)",
  },
})
