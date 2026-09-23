import * as stylex from "@stylexjs/stylex"

import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Frame {...stylex.props(exampleStyles.example1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Heading as="h2" {...stylex.props(exampleStyles.example2)}>
          Separated panel
        </Heading>
        <Paragraph {...stylex.props(exampleStyles.example3)}>
          Section description
        </Paragraph>
      </FramePanel>
      <FramePanel>
        <Heading as="h2" {...stylex.props(exampleStyles.example2)}>
          Separated panel
        </Heading>
        <Paragraph {...stylex.props(exampleStyles.example3)}>
          Section description
        </Paragraph>
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
