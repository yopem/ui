// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerClose,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"

export default function Particle() {
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
          <nav {...stylex.props(demoStyles.demo1)}>
            <DrawerClose
              nativeButton={false}
              render={
                <Button
                  {...stylex.props(demoStyles.demo2)}
                  render={<a aria-label="Home" href="/" />}
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
                  {...stylex.props(demoStyles.demo2)}
                  render={<a aria-label="Home" href="/" />}
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
                  {...stylex.props(demoStyles.demo2)}
                  render={<a aria-label="Home" href="/" />}
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
                  {...stylex.props(demoStyles.demo2)}
                  render={<a aria-label="Home" href="/" />}
                  variant="ghost"
                />
              }
            >
              Sign out
            </DrawerClose>
          </nav>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  )
}

const demoStyles = stylex.create({
  demo1: {
    marginInline: "calc(calc(calc(0.25rem * 3) - 1px) * -1)",
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 0.5)",
  },
  demo2: {
    justifyContent: "flex-start",
  },
})
