// next/link replaced -> anchor
import { Button } from "@/components/ui/stylex/button"
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

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
