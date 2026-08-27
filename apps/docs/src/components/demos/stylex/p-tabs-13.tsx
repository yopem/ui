import * as stylex from "@stylexjs/stylex"
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  return (
    <TooltipProvider>
      <Tabs {...stylex.props(demoStyles.demo1)} defaultValue="tab-1">
        <TabsList>
          <Tooltip>
            <TooltipTrigger
              render={<TabsTab aria-label="Overview" value="tab-1" />}
            >
              <HouseIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipPopup>Overview</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={<TabsTab aria-label="Projects" value="tab-2" />}
            >
              <PanelsTopLeftIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipPopup>Projects</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={<TabsTab aria-label="Settings" value="tab-3" />}
            >
              <SettingsIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipPopup>Settings</TooltipPopup>
          </Tooltip>
        </TabsList>
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
    </TooltipProvider>
  )
}

const demoStyles = stylex.create({
  demo1: {
    alignItems: "center",
  },
  demo2: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
