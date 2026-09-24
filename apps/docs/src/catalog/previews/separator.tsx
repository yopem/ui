import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { Separator } from "@/components/ui/separator"
export function Preview() {
  return (
    <Box maxInlineSize={"calc(0.25rem * 72)"}>
      <Flex flexDirection={"column"} gap={"0.25rem"}>
        <Heading
          as="h4"
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          fontWeight={"500"}
        >
          coss ui
        </Heading>
        <Paragraph
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          color={"var(--muted-foreground)"}
        >
          Unstyled, accessible primitives for fast product UI and design
          systems.
        </Paragraph>
      </Flex>
      <Separator marginBlock={"calc(0.25rem * 4)"} />
      <Flex
        alignItems={"center"}
        gap={"calc(0.25rem * 4)"}
        fontSize={"0.875rem"}
        lineHeight={"calc(1.25 / 0.875)"}
      >
        <Box>Blog</Box>
        <Separator orientation="vertical" />
        <Box>Docs</Box>
        <Separator orientation="vertical" />
        <Box>Source</Box>
        <Separator orientation="vertical" />
        <Box>Releases</Box>
      </Flex>
    </Box>
  )
}
