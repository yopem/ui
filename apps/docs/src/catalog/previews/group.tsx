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

import { Button } from "@/components/ui/button"
import { Group, GroupSeparator } from "@/components/ui/group"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu"

const styles = stylex.create({
  button: { borderStartEndRadius: 0, borderEndEndRadius: 0 },
  button2: { borderRadius: 0 },
  menu: { borderStartStartRadius: 0, borderEndStartRadius: 0 },
})

const menuItems = [
  { Icon: EditIcon, label: "Edit" },
  { Icon: ArchiveIcon, label: "Archive" },
  { Icon: ShareIcon, label: "Share" },
]

export function Preview() {
  return (
    <Group aria-label="File actions">
      <Button variant="outline" xstyle={styles.button}>
        <FilesIcon aria-hidden="true" {...stylex.props(previewStyles.icon)} />
        Files
      </Button>
      <GroupSeparator />
      <Button variant="outline" xstyle={styles.button2}>
        <FilmIcon aria-hidden="true" {...stylex.props(previewStyles.icon)} />
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
              xstyle={styles.menu}
            />
          }
        >
          <EllipsisIcon
            {...stylex.props(previewStyles.icon, previewStyles.preview1)}
          />
        </MenuTrigger>
        <MenuPopup align="end">
          {menuItems.map(({ Icon, label }) => (
            <MenuItem key={label}>
              <Icon aria-hidden="true" {...stylex.props(previewStyles.icon)} />
              {label}
            </MenuItem>
          ))}
          <MenuItem variant="destructive">
            <TrashIcon
              aria-hidden="true"
              {...stylex.props(previewStyles.icon)}
            />
            Delete
          </MenuItem>
        </MenuPopup>
      </Menu>
    </Group>
  )
}

const previewStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  preview1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
