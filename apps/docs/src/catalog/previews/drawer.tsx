import { Button } from "@registry/components/ui/button"
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@registry/components/ui/drawer"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  drawerHeader: { textAlign: "center" },
})

export function Preview() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Open drawer
      </DrawerTrigger>
      <DrawerPopup frameTitle="Station notice" showBar showCloseButton>
        <DrawerHeader xstyle={styles.drawerHeader}>
          <DrawerTitle>Station updates</DrawerTitle>
          <DrawerDescription>
            The east trail is open. Return borrowed equipment by 17:00.
          </DrawerDescription>
        </DrawerHeader>
      </DrawerPopup>
    </Drawer>
  )
}
