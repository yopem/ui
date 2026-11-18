"use client"

import type { ChartTooltipBodyRenderContext } from "@tanstack/charts/react/tooltip"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Card,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@registry/components/ui/card"
import {
  Chart,
  ChartContainer,
  ChartTooltipContent,
} from "@registry/components/ui/chart"
import { Heading } from "@registry/components/ui/heading"
import { Label } from "@registry/components/ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import { barY, defineChart } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { StrictMode, useState } from "react"

interface Point {
  date: string
  series: string
  visits: number
}

function renderTooltip(context: ChartTooltipBodyRenderContext<Point>) {
  return (
    <ChartTooltipContent context={context} nameKey="series" labelKey="date" />
  )
}

function InitialFocusSlot({
  name,
  deferred = false,
}: {
  name: "First" | "Second" | "Deferred"
  deferred?: boolean
}) {
  const [shown, setShown] = useState(false)
  const [loaded, setLoaded] = useState(!deferred)
  const [version, setVersion] = useState(0)
  const lowerName = name.toLowerCase()
  const series = `${name} series`

  const data = [10, 20, 30].slice(0, loaded ? 3 : 1).map((visits, index) => ({
    date: String(index + 1),
    series,
    visits: visits + version,
  }))

  const definition = defineChart({
    marks: [barY(data, { x: "date", y: "visits", color: "series" })],
    scales: {
      x: { scale: () => scaleBand<string>().padding(0.2) },
      y: { scale: scaleLinear, grid: true },
    },
    color: { domain: [series], range: [tokens["--chart-1"]] },
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
  })

  return (
    <Box render={<section />} aria-label={`${name} initial focus`}>
      <Card>
        <CardHeader>
          <CardTitle>{name} initial focus</CardTitle>
        </CardHeader>
        <CardPanel>
          <Stack>
            <Wrap>
              <Button onClick={() => setShown(true)}>
                Show {lowerName} chart
              </Button>
              {deferred ? (
                <Button onClick={() => setLoaded(true)}>
                  Load remaining points
                </Button>
              ) : null}
              <Button onClick={() => setVersion((value) => value + 1)}>
                Update {lowerName} data
              </Button>
            </Wrap>
            {shown ? (
              <StrictMode>
                <ChartContainer
                  config={{
                    [series]: { label: series, color: tokens["--chart-1"] },
                  }}
                >
                  <Chart
                    ariaLabel={`${name} initial focus chart`}
                    definition={definition}
                    height={220}
                    defaultIndex={deferred ? 2 : 0}
                    renderTooltipBody={renderTooltip}
                  />
                </ChartContainer>
              </StrictMode>
            ) : null}
          </Stack>
        </CardPanel>
      </Card>
    </Box>
  )
}

const selectionItems = [
  { label: "First option", value: "first" },
  { label: "Second option", value: "second" },
]

export function InitialFocusExamples() {
  return (
    <Box render={<section />} aria-label="Initial focus lifecycle">
      <Stack>
        <Heading>Initial focus lifecycle</Heading>
        <Text>Show each chart to inspect its initial focus.</Text>
        <Stack>
          <Label htmlFor="chart-lifecycle-selection">Lifecycle selection</Label>
          <Select items={selectionItems} defaultValue="first">
            <SelectTrigger id="chart-lifecycle-selection">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {selectionItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Stack>
        <InitialFocusSlot name="First" />
        <InitialFocusSlot name="Second" />
        <InitialFocusSlot name="Deferred" deferred />
      </Stack>
    </Box>
  )
}
