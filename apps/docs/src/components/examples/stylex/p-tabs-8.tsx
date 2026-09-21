import * as stylex from "@stylexjs/stylex"
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import { Paragraph } from "@/components/ui/stylex/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"
export default function Example() {
  return (
    <Tabs {...stylex.props(exampleStyles.example1)} defaultValue="tab-1">
      <TabsList>
        <TabsTab aria-label="Overview" value="tab-1">
          <HouseIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </TabsTab>
        <TabsTab aria-label="Projects" value="tab-2">
          <PanelsTopLeftIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </TabsTab>
        <TabsTab aria-label="Settings" value="tab-3">
          <SettingsIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Overview content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Projects content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph {...stylex.props(exampleStyles.example2)}>
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
    alignItems: "center",
  },
  example2: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
