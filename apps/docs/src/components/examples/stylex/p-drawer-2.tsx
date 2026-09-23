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

export default function Example() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Open drawer
      </DrawerTrigger>
      <DrawerPopup>
        <DrawerHeader {...stylex.props(exampleStyles.example1)}>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerDescription>
            This is the description of the drawer.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter {...stylex.props(exampleStyles.example2)} variant="bare">
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

const exampleStyles = stylex.create({
  example1: {
    textAlign: "center",
  },
  example2: {
    justifyContent: {
      default: "center",
      "@media (min-width: 40rem)": "center",
    },
  },
})
