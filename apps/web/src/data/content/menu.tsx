import React from "react"
import {
  Button,
  Menu,
  MenuContent,
  MenuItemGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@yopem-ui/react"

const menuComponent = {
  name: "Menu",
  description: "A dropdown menu component for selecting options or actions.",
  code: `
    <div>
      <Menu>
        <MenuTrigger asChild>
          <Button variant="outline">Open</Button>
        </MenuTrigger>
        <MenuContent className="w-56">
          <MenuSeparator />
          <MenuItemGroup>
            <MenuRadioItem value="top">Top</MenuRadioItem>
            <MenuRadioItem value="bottom">Bottom</MenuRadioItem>
            <MenuRadioItem value="right">Right</MenuRadioItem>
          </MenuItemGroup>
        </MenuContent>
      </Menu>
    </div>
  `,
  preview: (
    <div>
      <div>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </MenuTrigger>
          <MenuContent className="w-56">
            <MenuSeparator />
            <MenuItemGroup>
              <MenuRadioItem value="top">Top</MenuRadioItem>
              <MenuRadioItem value="bottom">Bottom</MenuRadioItem>
              <MenuRadioItem value="right">Right</MenuRadioItem>
            </MenuItemGroup>
          </MenuContent>
        </Menu>
      </div>
    </div>
  ),
}

export default menuComponent
