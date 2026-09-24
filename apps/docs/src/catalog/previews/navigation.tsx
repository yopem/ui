import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Link } from "@/components/ui/link"
export function Preview() {
  return (
    <Box as="nav" aria-label="Project sections">
      <Flex
        alignItems={"center"}
        backgroundColor={"var(--muted)"}
        borderRadius={"0.5rem"}
        gap={"0.125rem"}
        inlineSize={"fit-content"}
        justifyContent={"center"}
        padding={"0.125rem"}
        position={"relative"}
        zIndex={0}
      >
        <Link
          aria-current="page"
          alignItems={"center"}
          backgroundColor={"var(--background)"}
          blockSize={"2.125rem"}
          borderColor={"transparent"}
          borderRadius={"0.375rem"}
          borderStyle={"solid"}
          borderWidth={1}
          boxShadow={"0 1px 2px rgb(0 0 0 / 0.05)"}
          color={"var(--foreground)"}
          cursor={"pointer"}
          display={"inline-flex"}
          flexShrink={0}
          fontSize={"1rem"}
          fontWeight={500}
          justifyContent={"center"}
          outline={"2px solid transparent"}
          paddingInline={"calc(0.625rem - 1px)"}
          position={"relative"}
          textDecoration={"none"}
          transition={"outline-color 150ms"}
          userSelect={"none"}
          whiteSpace={"nowrap"}
          md={{ blockSize: "1.875rem", fontSize: "0.875rem" }}
          _focusVisible={{ outlineColor: "var(--ring)" }}
          href="#overview"
        >
          Overview
        </Link>
        <Link
          alignItems={"center"}
          backgroundColor={"transparent"}
          blockSize={"2.125rem"}
          borderColor={"transparent"}
          borderRadius={"0.375rem"}
          borderStyle={"solid"}
          borderWidth={1}
          boxShadow={"none"}
          color={"var(--muted-foreground)"}
          cursor={"pointer"}
          display={"inline-flex"}
          flexShrink={0}
          fontSize={"1rem"}
          fontWeight={500}
          justifyContent={"center"}
          outline={"2px solid transparent"}
          paddingInline={"calc(0.625rem - 1px)"}
          position={"relative"}
          textDecoration={"none"}
          transition={"outline-color 150ms"}
          userSelect={"none"}
          whiteSpace={"nowrap"}
          md={{ blockSize: "1.875rem", fontSize: "0.875rem" }}
          _hover={{ color: "var(--muted-foreground)" }}
          _focusVisible={{ outlineColor: "var(--ring)" }}
          href="#activity"
        >
          Activity
        </Link>
        <Link
          alignItems={"center"}
          backgroundColor={"transparent"}
          blockSize={"2.125rem"}
          borderColor={"transparent"}
          borderRadius={"0.375rem"}
          borderStyle={"solid"}
          borderWidth={1}
          boxShadow={"none"}
          color={"var(--muted-foreground)"}
          cursor={"pointer"}
          display={"inline-flex"}
          flexShrink={0}
          fontSize={"1rem"}
          fontWeight={500}
          justifyContent={"center"}
          outline={"2px solid transparent"}
          paddingInline={"calc(0.625rem - 1px)"}
          position={"relative"}
          textDecoration={"none"}
          transition={"outline-color 150ms"}
          userSelect={"none"}
          whiteSpace={"nowrap"}
          md={{ blockSize: "1.875rem", fontSize: "0.875rem" }}
          _hover={{ color: "var(--muted-foreground)" }}
          _focusVisible={{ outlineColor: "var(--ring)" }}
          href="#settings"
        >
          Settings
        </Link>
      </Flex>
    </Box>
  )
}
