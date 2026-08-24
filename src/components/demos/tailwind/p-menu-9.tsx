import { Button } from "@/components/ui/tailwind/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/tailwind/menu";

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuCheckboxItem defaultChecked variant="switch">
          Auto save
        </MenuCheckboxItem>
        <MenuCheckboxItem variant="switch">Notifications</MenuCheckboxItem>
        <MenuCheckboxItem defaultChecked variant="switch">
          Dark mode
        </MenuCheckboxItem>
      </MenuPopup>
    </Menu>
  );
}
