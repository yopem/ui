import * as stylex from "@stylexjs/stylex"
import { HouseIcon, PanelsTopLeftIcon, SettingsIcon } from "lucide-react"

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"

const tabs = [
  { Icon: HouseIcon, label: "Overview", value: "tab-1" },
  { Icon: PanelsTopLeftIcon, label: "Projects", value: "tab-2" },
  { Icon: SettingsIcon, label: "Settings", value: "tab-3" },
]

export default function Particle() {
  return (
    <Tabs
      {...stylex.props(demoStyles.demo1)}
      defaultValue="tab-1"
      orientation="vertical"
    >
      <div {...stylex.props(demoStyles.demo2)}>
        <TabsList variant="underline">
          {tabs.map(({ Icon, label, value }) => (
            <TabsTab key={value} value={value}>
              <Icon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
              {label}
            </TabsTab>
          ))}
        </TabsList>
      </div>
      {tabs.map(({ label, value }) => (
        <TabsPanel key={value} value={value}>
          <p {...stylex.props(demoStyles.demo3)}>{label} content</p>
        </TabsPanel>
      ))}
    </Tabs>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    marginInline: "-0.125rem",
  },
  demo1: {
    inlineSize: "100%",
    flexDirection: "row",
  },
  demo2: {
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
  },
  demo3: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
