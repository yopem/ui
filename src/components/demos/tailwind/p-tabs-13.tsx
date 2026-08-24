import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tailwind/tabs"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tailwind/tooltip"

export default function Particle() {
  return (
    <TooltipProvider>
      <Tabs className="items-center" defaultValue="tab-1">
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
          <p className="text-muted-foreground p-4 text-center text-xs">
            Overview content
          </p>
        </TabsPanel>
        <TabsPanel value="tab-2">
          <p className="text-muted-foreground p-4 text-center text-xs">
            Projects content
          </p>
        </TabsPanel>
        <TabsPanel value="tab-3">
          <p className="text-muted-foreground p-4 text-center text-xs">
            Settings content
          </p>
        </TabsPanel>
      </Tabs>
    </TooltipProvider>
  )
}
