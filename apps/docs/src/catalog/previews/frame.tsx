import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@registry/components/ui/frame"
import { Heading } from "@registry/components/ui/heading"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { inlineSize: "100%" },
  h2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "600",
  },
  paragraph: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  paragraph2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})

export function Preview() {
  return (
    <Frame xstyle={styles.frame}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Heading as="h2" xstyle={styles.h2}>
          Section title
        </Heading>
        <Text xstyle={styles.paragraph}>Section description</Text>
      </FramePanel>
      <FrameFooter>
        <Text xstyle={styles.paragraph2}>Footer</Text>
      </FrameFooter>
    </Frame>
  )
}
