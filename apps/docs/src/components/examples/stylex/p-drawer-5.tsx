import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Flex } from "@/components/ui/flex"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Drawer position="right">
        <DrawerTrigger render={<Button variant="outline" />}>
          Right
        </DrawerTrigger>
        <DrawerPopup variant="straight">
          <DrawerHeader>
            <DrawerTitle>Right</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <Paragraph {...stylex.props(exampleStyles.example2)}>
              Content from the right.
            </Paragraph>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
      <Drawer position="left">
        <DrawerTrigger render={<Button variant="outline" />}>
          Left
        </DrawerTrigger>
        <DrawerPopup variant="straight">
          <DrawerHeader>
            <DrawerTitle>Left</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <Paragraph {...stylex.props(exampleStyles.example2)}>
              Content from the left.
            </Paragraph>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
      <Drawer position="top">
        <DrawerTrigger render={<Button variant="outline" />}>Top</DrawerTrigger>
        <DrawerPopup variant="straight">
          <DrawerHeader>
            <DrawerTitle>Top</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <Paragraph {...stylex.props(exampleStyles.example2)}>
              Content from the top.
            </Paragraph>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
      <Drawer>
        <DrawerTrigger render={<Button variant="outline" />}>
          Bottom
        </DrawerTrigger>
        <DrawerPopup variant="straight">
          <DrawerHeader>
            <DrawerTitle>Bottom</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <Paragraph {...stylex.props(exampleStyles.example2)}>
              Content from the bottom.
            </Paragraph>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
