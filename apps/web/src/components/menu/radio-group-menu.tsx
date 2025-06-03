"use client"

import { useState } from "react"
import {
  Button,
  Menu,
  MenuContent,
  MenuItemGroupLabel,
  MenuItemText,
  MenuRadioItem,
  MenuRadioItemGroup,
  MenuTrigger,
} from "@yopem-ui/react"

export const RadioGroupContent = () => {
  const [value, setValue] = useState("React")

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Radio Group Menu</Button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuRadioItemGroup
          value={value}
          onValueChange={(e) => setValue(e.value)}
        >
          <MenuItemGroupLabel>JS Frameworks</MenuItemGroupLabel>
          {["React", "Solid", "Vue"].map((framework) => (
            <MenuRadioItem key={framework} value={framework}>
              <MenuItemText>{framework}</MenuItemText>
            </MenuRadioItem>
          ))}
        </MenuRadioItemGroup>
      </MenuContent>
    </Menu>
  )
}
