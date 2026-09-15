// next/link replaced -> anchor
import { Button } from "@/components/ui/stylex/button"
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

export default function Example() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuLinkItem render={<a aria-label="Examples" href="/docs" />}>
          Docs
        </MenuLinkItem>
        <MenuLinkItem render={<a aria-label="Examples" href="/particles" />}>
          Examples
        </MenuLinkItem>
      </MenuPopup>
    </Menu>
  )
}
