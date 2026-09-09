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
    <Group aria-label="File actions">
      <Button xstyle={groupItemStyles.item}>
        <FilesIcon aria-hidden="true" {...stylex.props(demoStyles.icon)} />
        Files
      </Button>
      <GroupSeparator xstyle={demoStyles.demo1} />
      <Button xstyle={groupItemStyles.item}>
        <FilmIcon aria-hidden="true" {...stylex.props(demoStyles.icon)} />
        Media
      </Button>
      <GroupSeparator xstyle={demoStyles.demo1} />
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label="Menu"
              size="icon"
              xstyle={groupItemStyles.item}
            />
          }
        >
          <EllipsisIcon
            aria-hidden="true"
            {...stylex.props(demoStyles.icon, demoStyles.demo2)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem>
            <EditIcon aria-hidden="true" {...stylex.props(demoStyles.icon)} />
            Edit
          </MenuItem>
          <MenuItem>
            <ArchiveIcon
              aria-hidden="true"
              {...stylex.props(demoStyles.icon)}
            />
            Archive
          </MenuItem>
          <MenuItem>
            <ShareIcon aria-hidden="true" {...stylex.props(demoStyles.icon)} />
            Share
          </MenuItem>
          <MenuItem variant="destructive">
            <TrashIcon aria-hidden="true" {...stylex.props(demoStyles.icon)} />
            Delete
          </MenuItem>
        </MenuPopup>
      </Menu>
    </Group>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
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
