// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerSwipeArea,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Flex } from "@/components/ui/flex"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Box {...stylex.props(exampleStyles.example1)}>
      <Drawer modal={false} position="left">
        <DrawerSwipeArea {...stylex.props(exampleStyles.example2)}>
          <Box as="span" {...stylex.props(exampleStyles.example3)}>
            Swipe area
          </Box>
        </DrawerSwipeArea>

        <Flex {...stylex.props(exampleStyles.example4)}>
          <Paragraph {...stylex.props(exampleStyles.example5)}>
            Swipe from the left edge to open the menu.
          </Paragraph>
        </Flex>

        <DrawerPopup position="left" showCloseButton variant="straight">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <Box as="nav" {...stylex.props(exampleStyles.example6)}>
              <Button
                {...stylex.props(exampleStyles.example7)}
                render={<Link aria-label="Home" href="/" />}
                variant="ghost"
              >
                Home
              </Button>
              <Button
                {...stylex.props(exampleStyles.example7)}
                render={<Link aria-label="Home" href="/" />}
                variant="ghost"
              >
                Profile
              </Button>
              <Button
                {...stylex.props(exampleStyles.example7)}
                render={<Link aria-label="Home" href="/" />}
                variant="ghost"
              >
                Settings
              </Button>
              <Button
                {...stylex.props(exampleStyles.example7)}
                render={<Link aria-label="Home" href="/" />}
                variant="ghost"
              >
                Sign out
              </Button>
            </Box>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    position: "relative",
    minBlockSize: "calc(0.25rem * 80)",
    inlineSize: "100%",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 4px)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  example2: {
    position: "absolute",
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: "1px",
    borderStyle: "dashed",
    borderColor: "var(--input)",
    backgroundColor: "var(--muted)",
  },
  example3: {
    pointerEvents: "none",
    position: "absolute",
    insetBlockStart: "calc(1 / 2 * 100%)",
    insetInlineStart: "0px",
    marginInlineStart: "calc(0.25rem * 2)",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    rotate: "90deg",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    whiteSpace: "nowrap",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  example4: {
    display: "flex",
    minBlockSize: "calc(0.25rem * 80)",
    alignItems: "center",
    justifyContent: "center",
    padding: "calc(0.25rem * 6)",
    paddingInlineStart: "calc(0.25rem * 14)",
    textAlign: "center",
  },
  example5: {
    maxInlineSize: "calc(0.25rem * 56)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    textWrap: "balance",
    color: "var(--muted-foreground)",
  },
  example6: {
    marginInline: "calc(calc(calc(0.25rem * 3) - 1px) * -1)",
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 0.5)",
  },
  example7: {
    justifyContent: "flex-start",
  },
})
