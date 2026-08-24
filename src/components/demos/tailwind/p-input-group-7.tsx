"use client";

import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/tailwind/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/tailwind/popover";

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Password"
        placeholder="Password"
        type="password"
      />
      <InputGroupAddon align="inline-end">
        <Popover>
          <PopoverTrigger
            openOnHover
            render={
              <Button
                aria-label="Password requirements"
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverPopup side="top" tooltipStyle>
            <p>Min. 8 characters</p>
          </PopoverPopup>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
