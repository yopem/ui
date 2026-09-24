import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function Preview() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Open drawer
      </DrawerTrigger>
      <DrawerPopup showBar>
        <DrawerHeader {...stylex.props(previewStyles.preview1)}>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerDescription>
            This is the description of the drawer.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter {...stylex.props(previewStyles.preview2)} variant="bare">
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

const previewStyles = stylex.create({
  preview1: {
    textAlign: "center",
  },
  preview2: {
    justifyContent: {
      default: "center",
      "@media (min-width: 40rem)": "center",
    },
  },
})
