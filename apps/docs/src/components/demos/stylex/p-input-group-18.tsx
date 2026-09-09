import * as stylex from "@stylexjs/stylex"
import { EllipsisIcon } from "lucide-react"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

export default function Particle() {
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
            <EllipsisIcon {...stylex.props(demoStyles.icon)} />
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

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})
