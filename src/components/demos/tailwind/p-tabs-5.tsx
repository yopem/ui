import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tailwind/tabs"

export default function Particle() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList className="[--radius:9999px]">
        <TabsTab value="tab-1">Tab 1</TabsTab>
        <TabsTab value="tab-2">Tab 2</TabsTab>
        <TabsTab value="tab-3">Tab 3</TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <p className="text-muted-foreground p-4 text-center text-xs">
          Tab 1 content
        </p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p className="text-muted-foreground p-4 text-center text-xs">
          Tab 2 content
        </p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p className="text-muted-foreground p-4 text-center text-xs">
          Tab 3 content
        </p>
      </TabsPanel>
    </Tabs>
  )
}
