import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tailwind/tabs"

export default function Particle() {
  return (
    <Tabs
      className="w-full flex-row"
      defaultValue="tab-1"
      orientation="vertical"
    >
      <div className="border-s">
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
  )
}
