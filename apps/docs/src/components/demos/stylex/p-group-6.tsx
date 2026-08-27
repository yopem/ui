import * as stylex from "@stylexjs/stylex"
import {
  ArchiveIcon,
  EditIcon,
  EllipsisIcon,
  FilesIcon,
  FilmIcon,
  ShareIcon,
  TrashIcon,
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
    <Group aria-label="File actions">
      <Button>
        <FilesIcon aria-hidden="true" />
        Files
      </Button>
      <GroupSeparator {...stylex.props(demoStyles.demo1)} />
      <Button>
        <FilmIcon aria-hidden="true" />
        Media
      </Button>
      <GroupSeparator {...stylex.props(demoStyles.demo1)} />
      <Menu>
        <MenuTrigger render={<Button aria-label="Menu" size="icon" />}>
          <EllipsisIcon
            aria-hidden="true"
            {...stylex.props(demoStyles.demo2)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem>
            <EditIcon aria-hidden="true" />
            Edit
          </MenuItem>
          <MenuItem>
            <ArchiveIcon aria-hidden="true" />
            Archive
          </MenuItem>
          <MenuItem>
            <ShareIcon aria-hidden="true" />
            Share
          </MenuItem>
          <MenuItem variant="destructive">
            <TrashIcon aria-hidden="true" />
            Delete
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
