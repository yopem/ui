import * as stylex from "@stylexjs/stylex"
import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from "lucide-react"

import { Box } from "@/components/ui/stylex/box"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/stylex/tabs"
export default function Example() {
  return (
    <Tabs {...stylex.props(exampleStyles.example1)} defaultValue="tab-1">
      <Box {...stylex.props(exampleStyles.example2)}>
        <TabsList variant="underline">
          <TabsTab {...stylex.props(exampleStyles.example3)} value="tab-1">
            <HouseIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon, exampleStyles.example4)}
              size={16}
            />
            Overview
          </TabsTab>
          <TabsTab {...stylex.props(exampleStyles.example3)} value="tab-2">
            <PanelsTopLeftIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon, exampleStyles.example4)}
              size={16}
            />
            Projects
          </TabsTab>
          <TabsTab {...stylex.props(exampleStyles.example5)} value="tab-3">
            <BoxIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.icon, exampleStyles.example4)}
              size={16}
            />
            Packages
          </TabsTab>
        </TabsList>
      </Box>
      <TabsPanel value="tab-1">
        <Paragraph {...stylex.props(exampleStyles.example6)}>
          Overview content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Paragraph {...stylex.props(exampleStyles.example6)}>
          Projects content
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Paragraph {...stylex.props(exampleStyles.example6)}>
          Packages content
        </Paragraph>
      </TabsPanel>
    </Tabs>
  )
}

const exampleStyles = stylex.create({
  icon: {
    flexShrink: 0,
    pointerEvents: "none",
    marginInline: "-0.125rem",
  },
  example1: {
    alignItems: "center",
  },
  example2: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
  },
  example3: {
    blockSize: "auto",
    flexDirection: "column",
    gap: "calc(0.25rem * 1.5)",
    paddingBlock: "calc(calc(0.25rem * 2) - 1px)",
  },
  example4: {
    opacity: "60%",
  },
  example5: {
    blockSize: "auto",
    flexDirection: "column",
    gap: "calc(0.25rem * 1.5)",
    paddingBlock: "calc(calc(0.25rem * 2.5) - 1px)",
  },
  example6: {
    padding: "calc(0.25rem * 4)",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
