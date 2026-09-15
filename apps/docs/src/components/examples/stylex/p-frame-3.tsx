import * as stylex from "@stylexjs/stylex"

import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/stylex/frame"

export default function Example() {
  return (
    <Frame {...stylex.props(exampleStyles.example1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <h2 {...stylex.props(exampleStyles.example2)}>Separated panel</h2>
        <p {...stylex.props(exampleStyles.example3)}>Section description</p>
      </FramePanel>
      <FramePanel>
        <h2 {...stylex.props(exampleStyles.example2)}>Separated panel</h2>
        <p {...stylex.props(exampleStyles.example3)}>Section description</p>
      </FramePanel>
    </Frame>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
  },
  example2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "600",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
