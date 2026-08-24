import { Button } from "@/components/ui/tailwind/button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/tailwind/menu";

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuItem closeOnClick>Profile</MenuItem>
        <MenuItem closeOnClick>Settings</MenuItem>
        <MenuItem closeOnClick>Log out</MenuItem>
      </MenuPopup>
    </Menu>
  );
}
