import * as stylex from "@stylexjs/stylex"

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"

export default function Example() {
  return (
    <Tabs
      {...stylex.props(exampleStyles.example1)}
      defaultValue="tab-1"
      orientation="vertical"
    >
      <TabsList>
        <TabsTab value="tab-1">Tab 1</TabsTab>
        <TabsTab value="tab-2">Tab 2</TabsTab>
        <TabsTab value="tab-3">Tab 3</TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <p {...stylex.props(exampleStyles.example2)}>Tab 1 content</p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p {...stylex.props(exampleStyles.example2)}>Tab 2 content</p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p {...stylex.props(exampleStyles.example2)}>Tab 3 content</p>
      </TabsPanel>
    </Tabs>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
  },
  example2: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
