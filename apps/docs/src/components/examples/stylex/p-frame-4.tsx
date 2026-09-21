import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/stylex/frame"
import { Heading } from "@/components/ui/stylex/heading"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { Separator } from "@/components/ui/stylex/separator"
export default function Example() {
  return (
    <Frame {...stylex.props(exampleStyles.example1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel {...stylex.props(exampleStyles.example2)}>
        <Box {...stylex.props(exampleStyles.example3)}>
          <Heading as="h2" {...stylex.props(exampleStyles.example4)}>
            Stacked panel
          </Heading>
          <Paragraph {...stylex.props(exampleStyles.example5)}>
            Section description
          </Paragraph>
        </Box>
        <Separator />
        <Box {...stylex.props(exampleStyles.example3)}>
          <Heading as="h2" {...stylex.props(exampleStyles.example4)}>
            Stacked panel
          </Heading>
          <Paragraph {...stylex.props(exampleStyles.example5)}>
            Section description
          </Paragraph>
        </Box>
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
