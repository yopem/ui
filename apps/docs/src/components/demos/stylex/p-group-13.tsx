import * as stylex from "@stylexjs/stylex"
import {
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  ShareIcon,
} from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

export default function Particle() {
  return (
    <Group aria-label="Subscription actions">
      <Button>Subscribe</Button>
      <GroupSeparator {...stylex.props(demoStyles.demo1)} />
      <Menu>
        <MenuTrigger render={<Button aria-label="Copy options" size="icon" />}>
          <ChevronDownIcon
            aria-hidden="true"
            {...stylex.props(demoStyles.demo2)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem>
            <ShareIcon aria-hidden="true" />
            Share link
          </MenuItem>
          <MenuItem>
            <DownloadIcon aria-hidden="true" />
            Download
          </MenuItem>
          <MenuItem>
            <EditIcon aria-hidden="true" />
            Duplicate
          </MenuItem>
        </MenuPopup>
      </Menu>
    </Group>
  )
}

const demoStyles = stylex.create({
  demo1: {
    backgroundColor: {
      default: "var(--primary)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary) 72%, transparent)",
    },
  },
  demo2: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
