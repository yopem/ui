// next/link replaced -> anchor
import { Button } from "@/components/ui/tailwind/button"
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/tailwind/menu"

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuLinkItem render={<a href="/docs" />}>Docs</MenuLinkItem>
        <MenuLinkItem render={<a href="/particles" />}>Particles</MenuLinkItem>
      </MenuPopup>
    </Menu>
  )
}
