import * as stylex from "@stylexjs/stylex"
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TrashIcon,
} from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
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
} from "@/components/ui/stylex/menu"

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>Playback</MenuGroupLabel>
          <MenuItem>
            <PlayIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
            Play
            <MenuShortcut>⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem disabled>
            <PauseIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
            Pause
            <MenuShortcut>⇧⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SkipBackIcon
              {...stylex.props(demoStyles.icon)}
              aria-hidden="true"
            />
            Previous
            <MenuShortcut>⌘[</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SkipForwardIcon
              {...stylex.props(demoStyles.icon)}
              aria-hidden="true"
            />
            Next
            <MenuShortcut>⌘]</MenuShortcut>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem>Shuffle</MenuCheckboxItem>
        <MenuCheckboxItem>Repeat</MenuCheckboxItem>
        <MenuCheckboxItem disabled>Enhanced Audio</MenuCheckboxItem>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Sort by</MenuGroupLabel>
          <MenuRadioGroup>
            <MenuRadioItem value="artist">Artist</MenuRadioItem>
            <MenuRadioItem value="album">Album</MenuRadioItem>
            <MenuRadioItem value="title">Title</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem variant="switch">Auto save</MenuCheckboxItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>Add to Playlist</MenuSubTrigger>
          <MenuSubPopup>
            <MenuItem>Jazz</MenuItem>
            <MenuSub>
              <MenuSubTrigger>Rock</MenuSubTrigger>
              <MenuSubPopup>
                <MenuItem>Hard Rock</MenuItem>
                <MenuItem>Soft Rock</MenuItem>
                <MenuItem>Classic Rock</MenuItem>
                <MenuSeparator />
                <MenuItem>Metal</MenuItem>
                <MenuItem>Punk</MenuItem>
                <MenuItem>Grunge</MenuItem>
                <MenuItem>Alternative</MenuItem>
                <MenuItem>Indie</MenuItem>
                <MenuItem>Electronic</MenuItem>
              </MenuSubPopup>
            </MenuSub>
            <MenuItem>Pop</MenuItem>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <TrashIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
          Delete
          <MenuShortcut>⌘⌫</MenuShortcut>
        </MenuItem>
      </MenuPopup>
    </Menu>
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
})
