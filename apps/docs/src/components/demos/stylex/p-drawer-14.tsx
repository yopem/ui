// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerSwipeArea,
  DrawerTitle,
} from "@/components/ui/stylex/drawer"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Drawer modal={false} position="left">
        <DrawerSwipeArea {...stylex.props(demoStyles.demo2)}>
          <span {...stylex.props(demoStyles.demo3)}>Swipe area</span>
        </DrawerSwipeArea>

        <div {...stylex.props(demoStyles.demo4)}>
          <p {...stylex.props(demoStyles.demo5)}>
            Swipe from the left edge to open the menu.
          </p>
        </div>

        <DrawerPopup position="left" showCloseButton variant="straight">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel>
            <nav {...stylex.props(demoStyles.demo6)}>
              <Button
                {...stylex.props(demoStyles.demo7)}
                render={<a aria-label="Home" href="/" />}
                variant="ghost"
              >
                Home
              </Button>
              <Button
                {...stylex.props(demoStyles.demo7)}
                render={<a aria-label="Home" href="/" />}
                variant="ghost"
              >
                Profile
              </Button>
              <Button
                {...stylex.props(demoStyles.demo7)}
                render={<a aria-label="Home" href="/" />}
                variant="ghost"
              >
                Settings
              </Button>
              <Button
                {...stylex.props(demoStyles.demo7)}
                render={<a aria-label="Home" href="/" />}
                variant="ghost"
              >
                Sign out
              </Button>
            </nav>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    position: "relative",
    minBlockSize: "calc(0.25rem * 80)",
    inlineSize: "100%",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 4px)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  demo2: {
    position: "absolute",
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: "1px",
    borderStyle: "dashed",
    borderColor: "var(--input)",
    backgroundColor: "var(--muted)",
  },
  demo3: {
    pointerEvents: "none",
    position: "absolute",
    insetBlockStart: "calc(1 / 2 * 100%)",
    insetInlineStart: "0px",
    marginInlineStart: "calc(0.25rem * 2)",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    rotate: "90deg",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    whiteSpace: "nowrap",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  demo4: {
    display: "flex",
    minBlockSize: "calc(0.25rem * 80)",
    alignItems: "center",
    justifyContent: "center",
    padding: "calc(0.25rem * 6)",
    paddingInlineStart: "calc(0.25rem * 14)",
    textAlign: "center",
  },
  demo5: {
    maxInlineSize: "calc(0.25rem * 56)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    textWrap: "balance",
    color: "var(--muted-foreground)",
  },
  demo6: {
    marginInline: "calc(calc(calc(0.25rem * 3) - 1px) * -1)",
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 0.5)",
  },
  demo7: {
    justifyContent: "flex-start",
  },
})
