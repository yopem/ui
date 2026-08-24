import {
  ArchiveIcon,
  EditIcon,
  EllipsisIcon,
  FilesIcon,
  FilmIcon,
  ShareIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/tailwind/button";
import { Group, GroupSeparator } from "@/components/ui/tailwind/group";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/tailwind/menu";

export default function Particle() {
  return (
    <Group aria-label="File actions">
      <Button>
        <FilesIcon aria-hidden="true" />
        Files
      </Button>
      <GroupSeparator className="bg-primary/72" />
      <Button>
        <FilmIcon aria-hidden="true" />
        Media
      </Button>
      <GroupSeparator className="bg-primary/72" />
      <Menu>
        <MenuTrigger render={<Button aria-label="Menu" size="icon" />}>
          <EllipsisIcon aria-hidden="true" className="size-4" />
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
  );
}
