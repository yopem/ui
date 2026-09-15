import * as stylex from "@stylexjs/stylex"
import {
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  ShareIcon,
} from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

export default function Particle() {
  return (
    <Group aria-label="Subscription actions">
      <Button xstyle={groupItemStyles.item}>Subscribe</Button>
      <GroupSeparator xstyle={exampleStyles.example1} />
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label="Copy options"
              size="icon"
              xstyle={groupItemStyles.item}
            />
          }
        >
          <ChevronDownIcon
            aria-hidden="true"
            {...stylex.props(exampleStyles.icon, exampleStyles.example2)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem>
            <ShareIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon)}
            />
            Share link
          </MenuItem>
          <MenuItem>
            <DownloadIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon)}
            />
            Download
          </MenuItem>
          <MenuItem>
            <EditIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon)}
            />
            Duplicate
          </MenuItem>
        </MenuPopup>
      </Menu>
    </Group>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    backgroundColor: {
      default: "var(--primary)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary) 72%, transparent)",
    },
  },
  example2: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
