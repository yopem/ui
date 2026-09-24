import * as stylex from "@stylexjs/stylex"

import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
const styles = stylex.create({
  paragraph: {
    paddingBlock: "calc(0.25rem * 4)",
    paddingInline: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  paragraph2: {
    paddingBlock: "calc(0.25rem * 4)",
    paddingInline: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  paragraph3: {
    paddingBlock: "calc(0.25rem * 4)",
    paddingInline: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
export function Preview() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTab value="tab-1">Tab 1</TabsTab>
        <TabsTab value="tab-2">Tab 2</TabsTab>
        <TabsTab value="tab-3">Tab 3</TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <Paragraph xstyle={styles.paragraph}>Tab 1 content</Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph xstyle={styles.paragraph2}>Tab 2 content</Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph xstyle={styles.paragraph3}>Tab 3 content</Paragraph>
      </TabsPanel>
    </Tabs>
  )
}
