import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"

export default function Example() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Drawer position="right">
        <DrawerTrigger render={<Button variant="outline" />}>
          Right
        </DrawerTrigger>
        <DrawerPopup variant="inset">
          <DrawerHeader>
            <DrawerTitle>Right</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <p {...stylex.props(exampleStyles.example2)}>
              Content from the right.
            </p>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
      <Drawer position="left">
        <DrawerTrigger render={<Button variant="outline" />}>
          Left
        </DrawerTrigger>
        <DrawerPopup variant="inset">
          <DrawerHeader>
            <DrawerTitle>Left</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <p {...stylex.props(exampleStyles.example2)}>
              Content from the left.
            </p>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
      <Drawer position="top">
        <DrawerTrigger render={<Button variant="outline" />}>Top</DrawerTrigger>
        <DrawerPopup variant="inset">
          <DrawerHeader>
            <DrawerTitle>Top</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <p {...stylex.props(exampleStyles.example2)}>
              Content from the top.
            </p>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
      <Drawer>
        <DrawerTrigger render={<Button variant="outline" />}>
          Bottom
        </DrawerTrigger>
        <DrawerPopup variant="inset">
          <DrawerHeader>
            <DrawerTitle>Bottom</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <p {...stylex.props(exampleStyles.example2)}>
              Content from the bottom.
            </p>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    </div>
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
