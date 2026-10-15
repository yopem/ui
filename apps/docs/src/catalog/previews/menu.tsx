import { Button } from "@registry/components/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@registry/components/ui/menu"
import * as stylex from "@stylexjs/stylex"
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TrashIcon,
} from "lucide-react"

export function Preview() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>Field recordings</MenuGroupLabel>
          <MenuItem>
            <PlayIcon
              {...stylex.props(previewStyles.icon)}
              aria-hidden="true"
            />
            Play
            <MenuShortcut>⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem disabled>
            <PauseIcon
              {...stylex.props(previewStyles.icon)}
              aria-hidden="true"
            />
            Pause
            <MenuShortcut>⇧⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SkipBackIcon
              {...stylex.props(previewStyles.icon)}
              aria-hidden="true"
            />
            Previous
            <MenuShortcut>⌘[</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SkipForwardIcon
              {...stylex.props(previewStyles.icon)}
              aria-hidden="true"
            />
            Next
            <MenuShortcut>⌘]</MenuShortcut>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem>Shuffle</MenuCheckboxItem>
        <MenuCheckboxItem>Repeat</MenuCheckboxItem>
        <MenuCheckboxItem disabled>Wind reduction</MenuCheckboxItem>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Sort by</MenuGroupLabel>
          <MenuRadioGroup>
            <MenuRadioItem value="observer">Observer</MenuRadioItem>
            <MenuRadioItem value="location">Location</MenuRadioItem>
            <MenuRadioItem value="title">Title</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem variant="switch">Auto save</MenuCheckboxItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>Add to collection</MenuSubTrigger>
          <MenuSubPopup>
            <MenuItem>Dawn chorus</MenuItem>
            <MenuSub>
              <MenuSubTrigger>Wetlands</MenuSubTrigger>
              <MenuSubPopup>
                <MenuItem>Reed bed</MenuItem>
                <MenuItem>Footbridge</MenuItem>
                <MenuItem>River bend</MenuItem>
                <MenuSeparator />
                <MenuItem>North pool</MenuItem>
                <MenuItem>South pool</MenuItem>
                <MenuItem>Boardwalk</MenuItem>
                <MenuItem>Meadow edge</MenuItem>
                <MenuItem>Willow grove</MenuItem>
                <MenuItem>Open water</MenuItem>
              </MenuSubPopup>
            </MenuSub>
            <MenuItem>Woodland</MenuItem>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <TrashIcon {...stylex.props(previewStyles.icon)} aria-hidden="true" />
          Delete
          <MenuShortcut>⌘⌫</MenuShortcut>
        </MenuItem>
      </MenuPopup>
    </Menu>
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
})
