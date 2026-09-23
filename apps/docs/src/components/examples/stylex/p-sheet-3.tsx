import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Paragraph } from "@/components/ui/paragraph"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open Right
        </SheetTrigger>
        <SheetPopup showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Right</SheetTitle>
            <SheetDescription>Right side of the screen.</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Paragraph>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open Left
        </SheetTrigger>
        <SheetPopup showCloseButton={false} side="left">
          <SheetHeader>
            <SheetTitle>Left</SheetTitle>
            <SheetDescription>Left side of the screen.</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Paragraph>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open Top
        </SheetTrigger>
        <SheetPopup showCloseButton={false} side="top">
          <SheetHeader>
            <SheetTitle>Top</SheetTitle>
            <SheetDescription>Top of the screen.</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Paragraph>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open Bottom
        </SheetTrigger>
        <SheetPopup showCloseButton={false} side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom</SheetTitle>
            <SheetDescription>Bottom of the screen.</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Paragraph>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
})
