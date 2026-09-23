import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Drawer position="right">
      <DrawerTrigger render={<Button variant="outline" />}>
        Open drawer
      </DrawerTrigger>
      <DrawerPopup showCloseButton variant="straight">
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerDescription>
            This is the description of the drawer.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <Paragraph {...stylex.props(exampleStyles.example1)}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris.
          </Paragraph>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  )
}

const exampleStyles = stylex.create({
  example1: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
