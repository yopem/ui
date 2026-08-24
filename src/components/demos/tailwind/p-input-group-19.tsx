"use client";

import { BoldIcon, ItalicIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/tailwind/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/tailwind/input-group";
import { Toggle } from "@/components/ui/tailwind/toggle";

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Tell us about yourself…" />
      <InputGroupAddon
        align="block-start"
        className="gap-1 rounded-t-lg border-b bg-muted/72 p-2!"
      >
        <Toggle aria-label="Toggle bold" size="sm">
          <BoldIcon aria-hidden="true" />
        </Toggle>
        <Toggle aria-label="Toggle italic" size="sm">
          <ItalicIcon aria-hidden="true" />
        </Toggle>
        <Button aria-label="Link" size="icon-sm" variant="ghost">
          <aIcon aria-hidden="true" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
