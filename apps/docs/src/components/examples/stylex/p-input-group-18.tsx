import * as stylex from "@stylexjs/stylex"
import { EllipsisIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupInput
        defaultValue="hello@coss.com"
        placeholder="Enter email"
        type="email"
      />
      <InputGroupAddon align="inline-end">
        <Badge variant="info">Primary</Badge>
        <Menu>
          <MenuTrigger
            render={
              <Button aria-label="Open menu" size="icon-xs" variant="ghost" />
            }
          >
            <EllipsisIcon {...stylex.props(exampleStyles.icon)} />
          </MenuTrigger>
          <MenuPopup align="end" alignOffset={-4} sideOffset={8}>
            <MenuItem disabled>Make Primary</MenuItem>
            <MenuItem variant="destructive">Delete</MenuItem>
          </MenuPopup>
        </Menu>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})
