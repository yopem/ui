import * as stylex from "@stylexjs/stylex"
import { CornerUpLeftIcon, StarIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/preview-card"
export default function Example() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="ghost" />}>
        coss.com/ui
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <Flex {...stylex.props(exampleStyles.example1)}>
          <Flex {...stylex.props(exampleStyles.example2)}>
            <Heading as="h2" {...stylex.props(exampleStyles.example3)}>
              coss.com/ui
            </Heading>
            <Paragraph {...stylex.props(exampleStyles.example4)}>
              Beautifully designed components that you can copy and paste into
              your apps.
            </Paragraph>
          </Flex>
          <Flex {...stylex.props(exampleStyles.example5)}>
            <Flex {...stylex.props(exampleStyles.example6)}>
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example7)}
              />
              <Box as="span">TypeScript</Box>
            </Flex>
            <Flex {...stylex.props(exampleStyles.example6)}>
              <StarIcon {...stylex.props(exampleStyles.example8)} />
              <Box as="span">58.2k</Box>
            </Flex>
            <Flex {...stylex.props(exampleStyles.example6)}>
              <CornerUpLeftIcon {...stylex.props(exampleStyles.example8)} />
              <Box as="span">5.1k</Box>
            </Flex>
          </Flex>
        </Flex>
      </PreviewCardPopup>
    </PreviewCard>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example5: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example6: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  example7: {
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(62.3% 0.214 259.815)",
  },
  example8: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
  },
})
