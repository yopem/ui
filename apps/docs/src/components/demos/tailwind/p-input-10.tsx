"use client"

import { InfoIcon, StarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/tailwind/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/tailwind/popover"

export default function Particle() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <InputGroup className="[--radius-lg:9999px] [--radius:9999rem]">
      <Popover>
        <InputGroupAddon>
          <PopoverTrigger
            render={<Button size="icon-xs" variant="secondary" />}
          >
            <InfoIcon />
          </PopoverTrigger>
        </InputGroupAddon>
        <PopoverPopup
          align="start"
          alignOffset={-5}
          className="w-64"
          sideOffset={6}
        >
          <PopoverTitle className="text-sm">
            Your connection is not secure.
          </PopoverTitle>
          <PopoverDescription>
            You should not enter any sensitive information on this site.
          </PopoverDescription>
        </PopoverPopup>
      </Popover>
      <InputGroupAddon className="text-muted-foreground pl-1.5">
        https://
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Url"
        className="*:[input]:ps-1!"
        type="text"
      />
      <InputGroupAddon align="inline-end">
        <Button
          onClick={() => setIsFavorite(!isFavorite)}
          size="icon-xs"
          variant="ghost"
        >
          <StarIcon
            className="data-[favorite=true]:fill-primary data-[favorite=true]:stroke-primary"
            data-favorite={isFavorite}
          />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}
