"use client"

import { useState } from "react"
import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItemText,
  MenuTrigger,
} from "@yopem-ui/react"

export const CheckboxMenu = () => {
  const [checked, setChecked] = useState(false)

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Checkbox Menu</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem
          checked={checked}
          onCheckedChange={setChecked}
          value="checked"
        >
          <MenuItemText>Check me</MenuItemText>
        </MenuCheckboxItem>
      </MenuContent>
    </Menu>
  )
}
