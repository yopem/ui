import * as stylex from "@stylexjs/stylex"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleIcon,
} from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Button
        aria-label="Pan camera up"
        {...stylex.props(demoStyles.demo2)}
        size="icon"
        variant="outline"
      >
        <ChevronUpIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
      </Button>
      <Button
        aria-label="Pan camera left"
        {...stylex.props(demoStyles.demo3)}
        size="icon"
        variant="outline"
      >
        <ChevronLeftIcon
          {...stylex.props(demoStyles.icon)}
          aria-hidden="true"
        />
      </Button>
      <div aria-hidden="true" {...stylex.props(demoStyles.demo4)}>
        <CircleIcon {...stylex.props(demoStyles.demo5)} />
      </div>
      <Button aria-label="Pan camera right" size="icon" variant="outline">
        <ChevronRightIcon
          {...stylex.props(demoStyles.icon)}
          aria-hidden="true"
        />
      </Button>
      <Button
        aria-label="Pan camera down"
        {...stylex.props(demoStyles.demo2)}
        size="icon"
        variant="outline"
      >
        <ChevronDownIcon
          {...stylex.props(demoStyles.icon)}
          aria-hidden="true"
        />
      </Button>
    </div>
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
  demo1: {
    display: "inline-grid",
    inlineSize: "fit-content",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.25rem",
  },
  demo2: {
    gridColumnStart: "2",
  },
  demo3: {
    gridColumnStart: "1",
  },
  demo4: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  demo5: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    opacity: "80%",
  },
})
