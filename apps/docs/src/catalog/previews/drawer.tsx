import { Button } from "@registry/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@registry/components/ui/drawer"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  drawerHeader: { textAlign: "center" },
  drawerFooter: {
    justifyContent: {
      default: "center",
      "@media (min-width: 768px)": "center",
    },
  },
})

export function Preview() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Open drawer
      </DrawerTrigger>
      <DrawerPopup showBar>
        <DrawerHeader xstyle={styles.drawerHeader}>
          <DrawerTitle>Station updates</DrawerTitle>
          <DrawerDescription>
            The east trail is open. Return borrowed equipment by 17:00.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter xstyle={styles.drawerFooter} variant="bare">
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
