import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"

export default function Particle() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Nested drawers
      </DrawerTrigger>
      <DrawerPopup showBar>
        <DrawerHeader {...stylex.props(demoStyles.demo1)}>
          <DrawerTitle>First step</DrawerTitle>
          <DrawerDescription>
            This is the first step. Tap the button below to continue to the next
            screen.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter {...stylex.props(demoStyles.demo2)} variant="bare">
          <DrawerClose render={<Button variant="ghost" />}>Cancel</DrawerClose>
          <Drawer>
            <DrawerTrigger render={<Button variant="outline" />}>
              Continue
            </DrawerTrigger>
            <DrawerPopup showBar>
              <DrawerHeader {...stylex.props(demoStyles.demo1)}>
                <DrawerTitle>Second step</DrawerTitle>
                <DrawerDescription>
                  You&apos;ve reached the second step. Tap the button below to
                  continue to the next screen.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerPanel>
                <div {...stylex.props(demoStyles.demo3)}>
                  <div {...stylex.props(demoStyles.demo4)} />
                </div>
              </DrawerPanel>
              <DrawerFooter {...stylex.props(demoStyles.demo2)} variant="bare">
                <DrawerClose render={<Button variant="ghost" />}>
                  Back
                </DrawerClose>
                <Drawer>
                  <DrawerTrigger render={<Button variant="outline" />}>
                    Continue
                  </DrawerTrigger>
                  <DrawerPopup showBar>
                    <DrawerHeader {...stylex.props(demoStyles.demo1)}>
                      <DrawerTitle>Third step</DrawerTitle>
                      <DrawerDescription>
                        You&apos;ve reached the final step. You can close this
                        drawer or go back.
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerPanel>
                      <div {...stylex.props(demoStyles.demo3)}>
                        <div {...stylex.props(demoStyles.demo5)} />
                      </div>
                    </DrawerPanel>
                  </DrawerPopup>
                </Drawer>
              </DrawerFooter>
            </DrawerPopup>
          </Drawer>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

const demoStyles = stylex.create({
  demo1: {
    textAlign: "center",
  },
  demo2: {
    justifyContent: {
      default: "center",
      "@media (min-width: 40rem)": "center",
    },
  },
  demo3: {
    display: "flex",
    justifyContent: "center",
  },
  demo4: {
    inlineSize: "calc(0.25rem * 48)",
    blockSize: "calc(0.25rem * 48)",
    flexShrink: "0",
    borderRadius: "calc(var(--radius) + 4px)",
    borderStyle: "solid",
    borderWidth: "1px",
    backgroundColor: "var(--muted)",
  },
  demo5: {
    inlineSize: "calc(0.25rem * 32)",
    blockSize: "calc(0.25rem * 32)",
    flexShrink: "0",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    backgroundColor: "var(--muted)",
  },
})
