import * as stylex from "@stylexjs/stylex"
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"

export default function Particle() {
  return (
    <Tabs defaultValue="tab-1">
      <div {...stylex.props(demoStyles.demo1)}>
        <TabsList variant="underline">
          <TabsTab value="tab-1">
            <HouseIcon aria-hidden="true" />
            Overview
          </TabsTab>
          <TabsTab value="tab-2">
            <PanelsTopLeftIcon aria-hidden="true" />
            Projects
          </TabsTab>
          <TabsTab value="tab-3">
            <SettingsIcon aria-hidden="true" />
            Settings
          </TabsTab>
        </TabsList>
      </div>
      <TabsPanel value="tab-1">
        <p {...stylex.props(demoStyles.demo2)}>Overview content</p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p {...stylex.props(demoStyles.demo2)}>Projects content</p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p {...stylex.props(demoStyles.demo2)}>Settings content</p>
      </TabsPanel>
    </Tabs>
  )
}

const demoStyles = stylex.create({
  demo1: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
  },
  demo2: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
