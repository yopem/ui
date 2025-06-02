import Link from "next/link"
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuItemGroup,
  MenuItemGroupLabel,
  MenuTrigger,
} from "@yopem-ui/react"

export const GroupMenu = () => (
  <Menu>
    <MenuTrigger asChild>
      <Button variant="outline">Group Menu</Button>
    </MenuTrigger>
    <MenuContent>
      <MenuItemGroup>
        <MenuItemGroupLabel>JS Frameworks</MenuItemGroupLabel>
        <MenuItem value="react">
          <Link href="https://react.com">React</Link>
        </MenuItem>
        <MenuItem value="solid">
          <Link href="https://solidjs.com">Solid</Link>
        </MenuItem>
        <MenuItem value="vue">
          <Link href="https://vuejs.org">Vue</Link>
        </MenuItem>
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItemGroupLabel>CSS Frameworks</MenuItemGroupLabel>
        <MenuItem value="panda">
          <Link href="https://pandaui.dev">Panda</Link>
        </MenuItem>
        <MenuItem value="tailwind">
          <Link href="https://tailwindcss.com">Tailwind</Link>
        </MenuItem>
      </MenuItemGroup>
    </MenuContent>
  </Menu>
)
