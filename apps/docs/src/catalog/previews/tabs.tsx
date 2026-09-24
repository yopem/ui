import * as stylex from "@stylexjs/stylex"

import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
export function Preview() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTab value="tab-1">Tab 1</TabsTab>
        <TabsTab value="tab-2">Tab 2</TabsTab>
        <TabsTab value="tab-3">Tab 3</TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <Paragraph {...stylex.props(previewStyles.preview1)}>
          Tab 1 content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph {...stylex.props(previewStyles.preview1)}>
          Tab 2 content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph {...stylex.props(previewStyles.preview1)}>
          Tab 3 content
        </Paragraph>
      </TabsPanel>
    </Tabs>
  )
}

const previewStyles = stylex.create({
  preview1: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
