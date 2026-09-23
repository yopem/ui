import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu"

export default function Example() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuCheckboxItem defaultChecked>Auto save</MenuCheckboxItem>
        <MenuCheckboxItem>Notifications</MenuCheckboxItem>
      </MenuPopup>
    </Menu>
  )
}
