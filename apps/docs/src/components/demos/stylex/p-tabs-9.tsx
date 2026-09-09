import * as stylex from "@stylexjs/stylex"
import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from "lucide-react"

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"

export default function Particle() {
  return (
    <Tabs {...stylex.props(demoStyles.demo1)} defaultValue="tab-1">
      <div {...stylex.props(demoStyles.demo2)}>
        <TabsList variant="underline">
          <TabsTab {...stylex.props(demoStyles.demo3)} value="tab-1">
            <HouseIcon
              aria-hidden="true"
              {...stylex.props(demoStyles.icon, demoStyles.demo4)}
              size={16}
            />
            Overview
          </TabsTab>
          <TabsTab {...stylex.props(demoStyles.demo3)} value="tab-2">
            <PanelsTopLeftIcon
              aria-hidden="true"
              {...stylex.props(demoStyles.icon, demoStyles.demo4)}
              size={16}
            />
            Projects
          </TabsTab>
          <TabsTab {...stylex.props(demoStyles.demo5)} value="tab-3">
            <BoxIcon
              aria-hidden="true"
              {...stylex.props(demoStyles.icon, demoStyles.demo4)}
              size={16}
            />
            Packages
          </TabsTab>
        </TabsList>
      </div>
      <TabsPanel value="tab-1">
        <p {...stylex.props(demoStyles.demo6)}>Overview content</p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p {...stylex.props(demoStyles.demo6)}>Projects content</p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p {...stylex.props(demoStyles.demo6)}>Packages content</p>
      </TabsPanel>
    </Tabs>
  )
}

const demoStyles = stylex.create({
  icon: {
    flexShrink: 0,
    pointerEvents: "none",
    marginInline: "-0.125rem",
  },
  demo1: {
    alignItems: "center",
  },
  demo2: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
  },
  demo3: {
    blockSize: "auto",
    flexDirection: "column",
    gap: "calc(0.25rem * 1.5)",
    paddingBlock: "calc(calc(0.25rem * 2) - 1px)",
  },
  demo4: {
    opacity: "60%",
  },
  demo5: {
    blockSize: "auto",
    flexDirection: "column",
    gap: "calc(0.25rem * 1.5)",
    paddingBlock: "calc(calc(0.25rem * 2.5) - 1px)",
  },
  demo6: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
