// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Link } from "@/components/ui/link"
export default function Example() {
  return (
    <Drawer position="left">
      <DrawerTrigger render={<Button variant="outline" />}>
        Open menu
      </DrawerTrigger>
      <DrawerPopup showCloseButton variant="straight">
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <DrawerPanel>
          <Box as="nav" {...stylex.props(exampleStyles.example1)}>
            <DrawerClose
              nativeButton={false}
              render={
                <Button
                  {...stylex.props(exampleStyles.example2)}
                  render={<Link aria-label="Home" href="/" />}
                  variant="ghost"
                />
              }
            >
              Home
            </DrawerClose>
            <DrawerClose
              nativeButton={false}
              render={
                <Button
                  {...stylex.props(exampleStyles.example2)}
                  render={<Link aria-label="Home" href="/" />}
                  variant="ghost"
                />
              }
            >
              Profile
            </DrawerClose>
            <DrawerClose
              nativeButton={false}
              render={
                <Button
                  {...stylex.props(exampleStyles.example2)}
                  render={<Link aria-label="Home" href="/" />}
                  variant="ghost"
                />
              }
            >
              Settings
            </DrawerClose>
            <DrawerClose
              nativeButton={false}
              render={
                <Button
                  {...stylex.props(exampleStyles.example2)}
                  render={<Link aria-label="Home" href="/" />}
                  variant="ghost"
                />
              }
            >
              Sign out
            </DrawerClose>
          </Box>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginInline: "calc(calc(calc(0.25rem * 3) - 1px) * -1)",
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 0.5)",
  },
  example2: {
    justifyContent: "flex-start",
  },
})
