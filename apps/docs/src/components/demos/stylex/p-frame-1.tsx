import * as stylex from "@stylexjs/stylex"

import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/stylex/frame"

export default function Particle() {
  return (
    <Frame {...stylex.props(demoStyles.demo1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <h2 {...stylex.props(demoStyles.demo2)}>Section title</h2>
        <p {...stylex.props(demoStyles.demo3)}>Section description</p>
      </FramePanel>
      <FrameFooter>
        <p {...stylex.props(demoStyles.demo3)}>Footer</p>
      </FrameFooter>
    </Frame>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
  },
  demo2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "600",
  },
  demo3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
