import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/stylex/collapsible"
import { Frame, FrameHeader, FramePanel } from "@/components/ui/stylex/frame"

export default function Particle() {
  return (
    <Frame {...stylex.props(demoStyles.demo1)}>
      <Collapsible>
        <FrameHeader {...stylex.props(demoStyles.demo2)}>
          <CollapsibleTrigger
            {...stylex.props(stylex.defaultMarker())}
            render={<Button variant="ghost" />}
          >
            <ChevronDownIcon
              {...stylex.props(demoStyles.demo3, demoStyles.report1)}
            />
            Section header
          </CollapsibleTrigger>
          <Button aria-label="Delete" size="icon" variant="ghost">
            <TrashIcon />
          </Button>
        </FrameHeader>
        <CollapsiblePanel>
          <FramePanel>
            <h2 {...stylex.props(demoStyles.demo4)}>Section title</h2>
            <p {...stylex.props(demoStyles.demo5)}>Section description</p>
          </FramePanel>
        </CollapsiblePanel>
      </Collapsible>
    </Frame>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
  },
  demo2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "calc(0.25rem * 2)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  demo3: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
  demo4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "600",
  },
  demo5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  report1: {
    transform: {
      default: "rotate(0deg)",
      [stylex.when.ancestor("[data-panel-open]")]: "rotate(180deg)",
    },
    transition: "transform 150ms",
  },
})
