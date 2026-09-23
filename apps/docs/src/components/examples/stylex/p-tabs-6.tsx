import * as stylex from "@stylexjs/stylex"
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
export default function Example() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTab value="tab-1">
          <HouseIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
          Overview
        </TabsTab>
        <TabsTab value="tab-2">
          <PanelsTopLeftIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
          Projects
        </TabsTab>
        <TabsTab value="tab-3">
          <SettingsIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
          Settings
        </TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <Paragraph {...stylex.props(exampleStyles.example1)}>
          Overview content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph {...stylex.props(exampleStyles.example1)}>
          Projects content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph {...stylex.props(exampleStyles.example1)}>
          Settings content
        </Paragraph>
      </TabsPanel>
    </Tabs>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    marginInline: "-0.125rem",
  },
  example1: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
