import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@registry/components/ui/tabs"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"

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
        <TabsTab value="tab-1">Meeting point</TabsTab>
        <TabsTab value="tab-2">Equipment</TabsTab>
        <TabsTab value="tab-3">Return</TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <Text xstyle={styles.paragraph}>Meet at the east gate at 07:00.</Text>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <Text xstyle={styles.paragraph2}>
          Bring binoculars and a waterproof notebook.
        </Text>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <Text xstyle={styles.paragraph3}>
          Return borrowed equipment before 17:00.
        </Text>
      </TabsPanel>
    </Tabs>
  )
}
