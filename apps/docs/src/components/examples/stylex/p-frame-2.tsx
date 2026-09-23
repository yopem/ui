import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Frame {...stylex.props(exampleStyles.example1)}>
      <Collapsible>
        <FrameHeader {...stylex.props(exampleStyles.example2)}>
          <CollapsibleTrigger
            {...stylex.props(stylex.defaultMarker())}
            render={<Button variant="ghost" />}
          >
            <ChevronDownIcon
              {...stylex.props(
                exampleStyles.icon,
                exampleStyles.example3,
                exampleStyles.report1,
              )}
            />
            Section header
          </CollapsibleTrigger>
          <Button aria-label="Delete" size="icon" variant="ghost">
            <TrashIcon {...stylex.props(exampleStyles.icon2)} />
          </Button>
        </FrameHeader>
        <CollapsiblePanel>
          <FramePanel>
            <Heading as="h2" {...stylex.props(exampleStyles.example4)}>
              Section title
            </Heading>
            <Paragraph {...stylex.props(exampleStyles.example5)}>
              Section description
            </Paragraph>
          </FramePanel>
        </CollapsiblePanel>
      </Collapsible>
    </Frame>
  )
}

const exampleStyles = stylex.create({
  icon: {
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  icon2: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "100%",
  },
  example2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "calc(0.25rem * 2)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  example3: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "600",
  },
  example5: {
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
