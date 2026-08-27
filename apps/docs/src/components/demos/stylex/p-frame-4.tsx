import * as stylex from "@stylexjs/stylex"

import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/stylex/frame"
import { Separator } from "@/components/ui/stylex/separator"

export default function Particle() {
  return (
    <Frame {...stylex.props(demoStyles.demo1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel {...stylex.props(demoStyles.demo2)}>
        <div {...stylex.props(demoStyles.demo3)}>
          <h2 {...stylex.props(demoStyles.demo4)}>Stacked panel</h2>
          <p {...stylex.props(demoStyles.demo5)}>Section description</p>
        </div>
        <Separator />
        <div {...stylex.props(demoStyles.demo3)}>
          <h2 {...stylex.props(demoStyles.demo4)}>Stacked panel</h2>
          <p {...stylex.props(demoStyles.demo5)}>Section description</p>
        </div>
      </FramePanel>
    </Frame>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
  },
  demo2: {
    padding: "0px",
  },
  demo3: {
    padding: "calc(0.25rem * 5)",
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
})
