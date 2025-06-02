"use client"

import {
  Button,
  DialogPortal,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  MenuTriggerItem,
} from "@yopem-ui/react"
import { Icon } from "@yopem-ui/react-icons"

export const NestedMenu = () => (
  <Menu>
    <MenuTrigger asChild>
      <Button variant="outline">Nested Menu</Button>
    </MenuTrigger>
    <MenuContent>
      <MenuItem value="react">React</MenuItem>
      <MenuItem value="solid">Solid</MenuItem>
      <MenuItem value="vue">Vue</MenuItem>
      <Menu>
        <MenuTriggerItem>
          JS Frameworks <Icon name="ChevronDown" />
        </MenuTriggerItem>
        <DialogPortal>
          <MenuContent>
            <MenuItem value="react">React</MenuItem>
            <MenuItem value="solid">Solid</MenuItem>
            <MenuItem value="vue">Vue</MenuItem>
          </MenuContent>
        </DialogPortal>
      </Menu>
      <Menu>
        <MenuTriggerItem>
          CSS Frameworks <Icon name="ChevronDown" />
        </MenuTriggerItem>
        <DialogPortal>
          <MenuContent>
            <MenuItem value="panda">Panda</MenuItem>
            <MenuItem value="tailwind">Tailwind</MenuItem>
          </MenuContent>
        </DialogPortal>
      </Menu>
    </MenuContent>
  </Menu>
)
