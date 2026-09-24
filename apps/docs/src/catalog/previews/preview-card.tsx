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
export function Preview() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="ghost" />}>
        coss.com/ui
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <Flex flexDirection={"column"} gap={"calc(0.25rem * 4)"}>
          <Flex flexDirection={"column"} gap={"0.25rem"}>
            <Heading
              as="h2"
              fontSize={"0.875rem"}
              lineHeight={"calc(1.25 / 0.875)"}
              fontWeight={"500"}
            >
              coss.com/ui
            </Heading>
            <Paragraph
              fontSize={"0.875rem"}
              lineHeight={"calc(1.25 / 0.875)"}
              color={"var(--muted-foreground)"}
            >
              Beautifully designed components that you can copy and paste into
              your apps.
            </Paragraph>
          </Flex>
          <Flex
            alignItems={"center"}
            gap={"calc(0.25rem * 4)"}
            fontSize={"0.75rem"}
            lineHeight={"calc(1 / 0.75)"}
            color={"var(--muted-foreground)"}
          >
            <Flex alignItems={"center"} gap={"0.25rem"}>
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 2)"}
                blockSize={"calc(0.25rem * 2)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor={"oklch(62.3% 0.214 259.815)"}
              />
              <Box as="span">TypeScript</Box>
            </Flex>
            <Flex alignItems={"center"} gap={"0.25rem"}>
              <StarIcon {...stylex.props(previewStyles.preview8)} />
              <Box as="span">58.2k</Box>
            </Flex>
            <Flex alignItems={"center"} gap={"0.25rem"}>
              <CornerUpLeftIcon {...stylex.props(previewStyles.preview8)} />
              <Box as="span">5.1k</Box>
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
