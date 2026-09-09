"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  const [open, setOpen] = useState(false)

  return (
    <Button
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={() => setOpen((prevState) => !prevState)}
      size="icon"
      variant="outline"
    >
      <svg
        aria-hidden="true"
        {...stylex.props(demoStyles.icon, demoStyles.demo1)}
        fill="none"
        height={16}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={16}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          {...stylex.props(
            demoStyles.report1,
            demoStyles.report1Manual,
            open && demoStyles.firstOpen,
          )}
          d="M4 12L20 12"
        />
        <path
          {...stylex.props(
            demoStyles.report2,
            demoStyles.report2Manual,
            open && demoStyles.secondOpen,
          )}
          d="M4 12H20"
        />
        <path
          {...stylex.props(
            demoStyles.report3,
            demoStyles.report3Manual,
            open && demoStyles.thirdOpen,
          )}
          d="M4 12H20"
        />
      </svg>
    </Button>
  )
}

const demoStyles = stylex.create({
  icon: {
    flexShrink: 0,
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    pointerEvents: "none",
  },
  report1: {
    transformOrigin: "center",
    translate: "0 calc(7px * -1)",
    transitionProperty: "all",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  report2: {
    transformOrigin: "center",
    transitionProperty: "all",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  report3: {
    transformOrigin: "center",
    translate: "0 7px",
    transitionProperty: "all",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  firstOpen: {
    rotate: "315deg",
    translate: "0 0",
  },
  secondOpen: {
    rotate: "45deg",
  },
  thirdOpen: {
    rotate: "135deg",
    translate: "0 0",
  },
  report1Manual: {
    transitionTimingFunction: "cubic-bezier(.5,.85,.25,1.1)",
  },
  report2Manual: {
    transitionTimingFunction: "cubic-bezier(.5,.85,.25,1.8)",
  },
  report3Manual: {
    transitionTimingFunction: "cubic-bezier(.5,.85,.25,1.1)",
  },
})
