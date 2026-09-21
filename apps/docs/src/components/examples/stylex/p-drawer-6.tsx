import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"
import { Flex } from "@/components/ui/stylex/flex"
export default function Example() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Scrollable content
      </DrawerTrigger>
      <DrawerPopup showBar>
        <DrawerHeader>
          <DrawerTitle>Scrollable content</DrawerTitle>
        </DrawerHeader>
        <DrawerPanel>
          <Flex {...stylex.props(exampleStyles.example1)}>
            {Array.from({ length: 48 }, (_, i) => `box-${i}`).map((key) => (
              <Box {...stylex.props(exampleStyles.example2)} key={key} />
            ))}
          </Flex>
        </DrawerPanel>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    blockSize: "calc(0.25rem * 12)",
    flexShrink: "0",
    borderRadius: "calc(var(--radius) + 4px)",
    borderStyle: "solid",
    borderWidth: "1px",
    backgroundColor: "var(--muted)",
  },
})
