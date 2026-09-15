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
    <Frame {...stylex.props(exampleStyles.example1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel {...stylex.props(exampleStyles.example2)}>
        <div {...stylex.props(exampleStyles.example3)}>
          <h2 {...stylex.props(exampleStyles.example4)}>Stacked panel</h2>
          <p {...stylex.props(exampleStyles.example5)}>Section description</p>
        </div>
        <Separator />
        <div {...stylex.props(exampleStyles.example3)}>
          <h2 {...stylex.props(exampleStyles.example4)}>Stacked panel</h2>
          <p {...stylex.props(exampleStyles.example5)}>Section description</p>
        </div>
      </FramePanel>
    </Frame>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
  },
  example2: {
    padding: "0px",
  },
  example3: {
    padding: "calc(0.25rem * 5)",
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
})
