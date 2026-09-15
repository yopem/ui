import { Button } from "@/components/ui/stylex/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

export default function Example() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuItem closeOnClick>Profile</MenuItem>
        <MenuItem closeOnClick>Settings</MenuItem>
        <MenuItem closeOnClick>Log out</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
