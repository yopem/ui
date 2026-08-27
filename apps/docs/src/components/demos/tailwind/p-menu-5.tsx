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
        <MenuLinkItem render={<a aria-label="Particles" href="/docs" />}>
          Docs
        </MenuLinkItem>
        <MenuLinkItem render={<a aria-label="Particles" href="/particles" />}>
          Particles
        </MenuLinkItem>
      </MenuPopup>
    </Menu>
  )
}
