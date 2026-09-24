import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { ScrollArea } from "@/components/ui/scroll-area"
const tags = Array.from({ length: 50 }, (_, i) => `v1.0.0-alpha.${i}`)

export function Preview() {
  return (
    <ScrollArea
      blockSize={"calc(0.25rem * 64)"}
      borderRadius={"var(--radius)"}
      borderStyle={"solid"}
      borderWidth={"1px"}
    >
      <Box
        paddingInline={"calc(0.25rem * 4)"}
        paddingBlock={"calc(0.25rem * 2)"}
      >
        <Heading
          as="h4"
          marginBlockEnd={"calc(0.25rem * 2)"}
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          fontWeight={"500"}
        >
          Tags
        </Heading>
        <Flex flexDirection={"column"} gap={"0.25rem"}>
          {tags.map((tag) => (
            <Box
              fontSize={"0.875rem"}
              lineHeight={"calc(1.25 / 0.875)"}
              key={tag}
            >
              {tag}
            </Box>
          ))}
        </Flex>
      </Box>
    </ScrollArea>
  )
}
