// next/link replaced -> anchor
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu"
export default function Example() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuLinkItem render={<Link aria-label="Examples" href="/docs" />}>
          Docs
        </MenuLinkItem>
        <MenuLinkItem render={<Link aria-label="Examples" href="/particles" />}>
          Examples
        </MenuLinkItem>
      </MenuPopup>
    </Menu>
  )
}
