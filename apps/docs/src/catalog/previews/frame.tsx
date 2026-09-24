import * as stylex from "@stylexjs/stylex"

import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
export function Preview() {
  return (
    <Frame {...stylex.props(previewStyles.preview1)}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Heading as="h2" {...stylex.props(previewStyles.preview2)}>
          Section title
        </Heading>
        <Paragraph {...stylex.props(previewStyles.preview3)}>
          Section description
        </Paragraph>
      </FramePanel>
      <FrameFooter>
        <Paragraph {...stylex.props(previewStyles.preview3)}>Footer</Paragraph>
      </FrameFooter>
    </Frame>
  )
}

const previewStyles = stylex.create({
  preview1: {
    inlineSize: "100%",
  },
  preview2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "600",
  },
  preview3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
