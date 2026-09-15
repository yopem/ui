"use client"
import * as stylex from "@stylexjs/stylex"
import {
  CopyIcon,
  EllipsisIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerClose,
  DrawerMenu,
  DrawerMenuCheckboxItem,
  DrawerMenuGroup,
  DrawerMenuGroupLabel,
  DrawerMenuItem,
  DrawerMenuRadioGroup,
  DrawerMenuRadioItem,
  DrawerMenuSeparator,
  DrawerMenuTrigger,
  DrawerPanel,
  DrawerPopup,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"
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
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/stylex/menu"
import { useMediaQuery } from "@/hooks/use-media-query"

const TRIGGER_ARIA_LABEL = "Open menu"
const rockPlaylists = [
  "Hard Rock",
  "Soft Rock",
  "Classic Rock",
  "Metal",
  "Punk",
  "Grunge",
  "Alternative",
  "Indie",
  "Electronic",
]

export default function Particle() {
  const isMobile = useMediaQuery("max-md")

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger
          render={
            <Button
              aria-label={TRIGGER_ARIA_LABEL}
              size="icon"
              variant="outline"
            />
          }
        >
          <EllipsisIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
        </DrawerTrigger>
        <DrawerPopup showBar>
          <DrawerPanel>
            <DrawerMenu>
              <DrawerMenuGroup>
                <DrawerMenuGroupLabel>Actions</DrawerMenuGroupLabel>
                <DrawerClose render={<DrawerMenuItem />}>
                  <PencilIcon
                    {...stylex.props(exampleStyles.icon)}
                    aria-hidden
                  />
                  Edit
                </DrawerClose>
                <DrawerClose render={<DrawerMenuItem />}>
                  <CopyIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
                  Duplicate
                </DrawerClose>
                <DrawerClose render={<DrawerMenuItem />}>
                  <ShareIcon
                    {...stylex.props(exampleStyles.icon)}
                    aria-hidden
                  />
                  Share
                </DrawerClose>
              </DrawerMenuGroup>
              <DrawerMenuSeparator />
              <DrawerMenuCheckboxItem>Shuffle</DrawerMenuCheckboxItem>
              <DrawerMenuCheckboxItem>Repeat</DrawerMenuCheckboxItem>
              <DrawerMenuCheckboxItem disabled>
                Enhanced Audio
              </DrawerMenuCheckboxItem>
              <DrawerMenuSeparator />
              <DrawerMenuGroup>
                <DrawerMenuGroupLabel>Sort by</DrawerMenuGroupLabel>
                <DrawerMenuRadioGroup defaultValue="artist">
                  <DrawerMenuRadioItem value="artist">
                    Artist
                  </DrawerMenuRadioItem>
                  <DrawerMenuRadioItem value="album">Album</DrawerMenuRadioItem>
                  <DrawerMenuRadioItem value="title">Title</DrawerMenuRadioItem>
                </DrawerMenuRadioGroup>
              </DrawerMenuGroup>
              <DrawerMenuSeparator />
              <DrawerMenuCheckboxItem variant="switch">
                Auto save
              </DrawerMenuCheckboxItem>
              <DrawerMenuSeparator />
              <Drawer>
                <DrawerMenuTrigger>Add to Playlist</DrawerMenuTrigger>
                <DrawerPopup showBar>
                  <DrawerPanel>
                    <DrawerMenu>
                      <DrawerMenuGroup>
                        <DrawerMenuGroupLabel>
                          Add to Playlist
                        </DrawerMenuGroupLabel>
                      </DrawerMenuGroup>
                      <DrawerClose render={<DrawerMenuItem />}>
                        Jazz
                      </DrawerClose>
                      <Drawer>
                        <DrawerMenuTrigger>Rock</DrawerMenuTrigger>
                        <DrawerPopup showBar>
                          <DrawerPanel>
                            <DrawerMenu>
                              <DrawerMenuGroup>
                                <DrawerMenuGroupLabel>
                                  Rock
                                </DrawerMenuGroupLabel>
                              </DrawerMenuGroup>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Hard Rock
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Soft Rock
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Classic Rock
                              </DrawerClose>
                              <DrawerMenuSeparator />
                              <DrawerClose render={<DrawerMenuItem />}>
                                Metal
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Punk
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Grunge
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Alternative
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Indie
                              </DrawerClose>
                              <DrawerClose render={<DrawerMenuItem />}>
                                Electronic
                              </DrawerClose>
                            </DrawerMenu>
                          </DrawerPanel>
                        </DrawerPopup>
                      </Drawer>
                      <DrawerClose render={<DrawerMenuItem />}>Pop</DrawerClose>
                    </DrawerMenu>
                  </DrawerPanel>
                </DrawerPopup>
              </Drawer>
              <DrawerMenuSeparator />
              <DrawerMenuGroup>
                <DrawerMenuGroupLabel>Danger zone</DrawerMenuGroupLabel>
                <DrawerClose render={<DrawerMenuItem variant="destructive" />}>
                  <TrashIcon
                    {...stylex.props(exampleStyles.icon)}
                    aria-hidden
                  />
                  Delete
                </DrawerClose>
              </DrawerMenuGroup>
            </DrawerMenu>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    )
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label={TRIGGER_ARIA_LABEL}
            size="icon"
            variant="outline"
          />
        }
      >
        <EllipsisIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
      </MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>Actions</MenuGroupLabel>
          <MenuItem>
            <PencilIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
            Edit
          </MenuItem>
          <MenuItem>
            <CopyIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
            Duplicate
          </MenuItem>
          <MenuItem>
            <ShareIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
            Share
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem>Shuffle</MenuCheckboxItem>
        <MenuCheckboxItem>Repeat</MenuCheckboxItem>
        <MenuCheckboxItem disabled>Enhanced Audio</MenuCheckboxItem>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Sort by</MenuGroupLabel>
          <MenuRadioGroup defaultValue="artist">
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
                {rockPlaylists.slice(0, 3).map((playlist) => (
                  <MenuItem key={playlist}>{playlist}</MenuItem>
                ))}
                <MenuSeparator />
                {rockPlaylists.slice(3).map((playlist) => (
                  <MenuItem key={playlist}>{playlist}</MenuItem>
                ))}
              </MenuSubPopup>
            </MenuSub>
            <MenuItem>Pop</MenuItem>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Danger zone</MenuGroupLabel>
          <MenuItem variant="destructive">
            <TrashIcon {...stylex.props(exampleStyles.icon)} aria-hidden />
            Delete
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
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
})
