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

const menuItems = [
  { Icon: EditIcon, label: "Edit" },
  { Icon: ArchiveIcon, label: "Archive" },
  { Icon: ShareIcon, label: "Share" },
]

export default function Particle() {
  return (
    <Group aria-label="File actions">
      <Button variant="outline" xstyle={groupItemStyles.item}>
        <FilesIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
        Files
      </Button>
      <GroupSeparator />
      <Button variant="outline" xstyle={groupItemStyles.item}>
        <FilmIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
        Media
      </Button>
      <GroupSeparator />
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label="Menu"
              size="icon"
              variant="outline"
              xstyle={groupItemStyles.item}
            />
          }
        >
          <EllipsisIcon
            {...stylex.props(exampleStyles.icon, exampleStyles.example1)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          {menuItems.map(({ Icon, label }) => (
            <MenuItem key={label}>
              <Icon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
              {label}
            </MenuItem>
          ))}
          <MenuItem variant="destructive">
            <TrashIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon)}
            />
            Delete
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
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
