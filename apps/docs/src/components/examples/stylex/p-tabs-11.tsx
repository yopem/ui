import * as stylex from "@stylexjs/stylex"
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
const tabs = [
  { Icon: HouseIcon, label: "Overview", value: "tab-1" },
  { Icon: PanelsTopLeftIcon, label: "Projects", value: "tab-2" },
  { Icon: SettingsIcon, label: "Settings", value: "tab-3" },
]

export default function Example() {
  return (
    <Tabs
      {...stylex.props(exampleStyles.example1)}
      defaultValue="tab-1"
      orientation="vertical"
    >
      <Box {...stylex.props(exampleStyles.example2)}>
        <TabsList variant="underline">
          {tabs.map(({ Icon, label, value }) => (
            <TabsTab key={value} value={value}>
              <Icon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
              {label}
            </TabsTab>
          ))}
        </TabsList>
      </Box>
      {tabs.map(({ label, value }) => (
        <TabsPanel key={value} value={value}>
          <Paragraph {...stylex.props(exampleStyles.example3)}>
            {label} content
          </Paragraph>
        </TabsPanel>
      ))}
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
    inlineSize: "100%",
    flexDirection: "row",
  },
  example2: {
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
  },
  example3: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
