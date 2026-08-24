import { FoldersIcon } from "lucide-react";
// next/link replaced -> anchor
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/tailwind/breadcrumb";
import { Button } from "@/components/ui/tailwind/button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/tailwind/menu";

export default function Particle() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger
              aria-label="More pages"
              render={
                <Button
                  className="-m-1.5 text-muted-foreground"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <FoldersIcon aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuItem render={<a href="/docs" />}>Docs</MenuItem>
              <MenuItem render={<a href="/particles" />}>Particles</MenuItem>
            </MenuPopup>
          </Menu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="/docs/" />}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
