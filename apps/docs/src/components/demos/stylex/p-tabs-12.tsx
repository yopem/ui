import * as stylex from "@stylexjs/stylex"
import { HouseIcon, InboxIcon, SettingsIcon } from "lucide-react"

import { Badge } from "@/components/ui/stylex/badge"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"

export default function Particle() {
  return (
    <Tabs {...stylex.props(demoStyles.demo1)} defaultValue="tab-1">
      <TabsList>
        <TabsTab
          aria-label="Overview"
          {...stylex.props(demoStyles.demo2)}
          value="tab-1"
        >
          <HouseIcon aria-hidden="true" />
        </TabsTab>
        <TabsTab
          aria-label="Inbox"
          {...stylex.props(demoStyles.demo2, stylex.defaultMarker())}
          value="tab-2"
        >
          <InboxIcon aria-hidden="true" />
          <Badge {...stylex.props(demoStyles.report1)} size="sm">
            5
          </Badge>
        </TabsTab>
        <TabsTab
          aria-label="Settings"
          {...stylex.props(demoStyles.demo2)}
          value="tab-3"
        >
          <SettingsIcon aria-hidden="true" />
        </TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <p {...stylex.props(demoStyles.demo3)}>Overview content</p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p {...stylex.props(demoStyles.demo3)}>Inbox content</p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p {...stylex.props(demoStyles.demo3)}>Settings content</p>
      </TabsPanel>
    </Tabs>
  )
}

const demoStyles = stylex.create({
  demo1: {
    alignItems: "center",
  },
  demo2: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
  },
  demo3: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  report1: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * 0)",
    insetBlockStart: "0px",
    borderRadius: "calc(infinity * 1px)",
    opacity: {
      default: 0.64,
      [stylex.when.ancestor("[data-active]")]: 1,
    },
  },
})
