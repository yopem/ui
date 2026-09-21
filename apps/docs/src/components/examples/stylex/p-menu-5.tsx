// next/link replaced -> anchor
import { Button } from "@/components/ui/stylex/button"
import { Link } from "@/components/ui/stylex/link"
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
