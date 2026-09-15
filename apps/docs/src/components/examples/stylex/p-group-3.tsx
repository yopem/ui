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
  { icon: EditIcon, label: "Edit" },
  { icon: ArchiveIcon, label: "Archive" },
  { icon: ShareIcon, label: "Share" },
  { icon: TrashIcon, label: "Delete", variant: "destructive" },
] as const

export default function Example() {
  return (
    <Group aria-label="File actions">
      <Button size="sm" variant="outline" xstyle={groupItemStyles.item}>
        <FilesIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
        Files
      </Button>
      <GroupSeparator />
      <Button size="sm" variant="outline" xstyle={groupItemStyles.item}>
        <FilmIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
        Media
      </Button>
      <GroupSeparator />
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label="Menu"
              size="icon-sm"
              variant="outline"
              xstyle={groupItemStyles.item}
            />
          }
        >
          <EllipsisIcon
            aria-hidden="true"
            {...stylex.props(exampleStyles.icon, exampleStyles.example1)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <MenuItem
                key={item.label}
                variant={"variant" in item ? item.variant : undefined}
              >
                <Icon
                  aria-hidden="true"
                  {...stylex.props(exampleStyles.icon)}
                />
                {item.label}
              </MenuItem>
            )
          })}
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
