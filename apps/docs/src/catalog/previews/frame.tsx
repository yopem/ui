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

export function Preview({ embedded = false }: { embedded?: boolean }) {
  return (
    <Frame xstyle={styles.frame}>
      <FrameHeader>
        <FrameTitle>Observation log</FrameTitle>
        <FrameDescription>Notes from the wetland survey</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Heading
          render={embedded ? <h4>East reed bed</h4> : <h2>East reed bed</h2>}
          xstyle={styles.h2}
        />
        <Text xstyle={styles.paragraph}>
          Two herons were seen near the footbridge.
        </Text>
      </FramePanel>
      <FrameFooter>
        <Text xstyle={styles.paragraph2}>Recorded at 07:40</Text>
      </FrameFooter>
    </Frame>
  )
}
