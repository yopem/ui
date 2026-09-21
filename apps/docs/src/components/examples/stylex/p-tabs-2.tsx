import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"
export default function Example() {
  return (
    <Tabs defaultValue="tab-1">
      <Box {...stylex.props(exampleStyles.example1)}>
        <TabsList variant="underline">
          <TabsTab value="tab-1">Tab 1</TabsTab>
          <TabsTab value="tab-2">Tab 2</TabsTab>
          <TabsTab value="tab-3">Tab 3</TabsTab>
        </TabsList>
      </Box>
      <TabsPanel value="tab-1">
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Tab 1 content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Tab 2 content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph {...stylex.props(exampleStyles.example2)}>
          Tab 3 content
        </Paragraph>
      </TabsPanel>
    </Tabs>
  )
}

const exampleStyles = stylex.create({
  example1: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
  },
  example2: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
