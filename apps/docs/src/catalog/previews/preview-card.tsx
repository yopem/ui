import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Flex } from "@registry/components/ui/flex"
import { Heading } from "@registry/components/ui/heading"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@registry/components/ui/preview-card"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { CornerUpLeftIcon, StarIcon } from "lucide-react"

const styles = stylex.create({
  flex: { flexDirection: "column", gap: "calc(0.25rem * 4)" },
  flex2: { flexDirection: "column", gap: "0.25rem" },
  h2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  paragraph: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  flex3: {
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  flex4: { alignItems: "center", gap: "0.25rem" },
  span: {
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: tokens["--info"],
  },
  flex5: { alignItems: "center", gap: "0.25rem" },
  flex6: { alignItems: "center", gap: "0.25rem" },
})

export function Preview() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="ghost" />}>
        Willow Creek field notes
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <Flex xstyle={styles.flex}>
          <Flex xstyle={styles.flex2}>
            <Heading
              render={<h2>Willow Creek field notes</h2>}
              xstyle={styles.h2}
            />
            <Text xstyle={styles.paragraph}>
              A shared notebook of bird sightings, water samples, and trail
              observations from the station.
            </Text>
          </Flex>
          <Flex xstyle={styles.flex3}>
            <Flex xstyle={styles.flex4}>
              <Box render={<span />} aria-hidden="true" xstyle={styles.span} />
              <Box render={<span />}>Field archive</Box>
            </Flex>
            <Flex xstyle={styles.flex5}>
              <StarIcon {...stylex.props(previewStyles.preview8)} />
              <Box render={<span />}>246</Box>
            </Flex>
            <Flex xstyle={styles.flex6}>
              <CornerUpLeftIcon {...stylex.props(previewStyles.preview8)} />
              <Box render={<span />}>32</Box>
            </Flex>
          </Flex>
        </Flex>
      </PreviewCardPopup>
    </PreviewCard>
  )
}

const previewStyles = stylex.create({
  preview8: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
  },
})
