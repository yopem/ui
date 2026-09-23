import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/badge"
import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
export default function Example() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTab {...stylex.props(stylex.defaultMarker())} value="tab-1">
          All
          <Badge {...stylex.props(exampleStyles.report1)} variant="outline">
            128
          </Badge>
        </TabsTab>
        <TabsTab {...stylex.props(stylex.defaultMarker())} value="tab-2">
          Pending
          <Badge {...stylex.props(exampleStyles.report1)} variant="outline">
            8
          </Badge>
        </TabsTab>
        <TabsTab {...stylex.props(stylex.defaultMarker())} value="tab-3">
          Completed
          <Badge {...stylex.props(exampleStyles.report1)} variant="outline">
            120
          </Badge>
        </TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <Paragraph {...stylex.props(exampleStyles.example1)}>
          All items content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph {...stylex.props(exampleStyles.example1)}>
          Pending items content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph {...stylex.props(exampleStyles.example1)}>
          Completed items content
        </Paragraph>
      </TabsPanel>
    </Tabs>
  )
}

const exampleStyles = stylex.create({
  example1: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },

  report1: {
    color: {
      default: "var(--muted-foreground)",
      [stylex.when.ancestor("[data-active]")]: "inherit",
    },
  },
})
