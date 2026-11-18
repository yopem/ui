"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type {
  ChartBuildContext,
  ChartInteractionController,
  ChartTheme,
  ChartTooltipRow,
  ChartValue,
} from "@tanstack/charts"
import type {
  ChartProps as TanStackChartProps,
  ChartTooltipBodyRenderContext,
} from "@tanstack/charts/react/tooltip"
import type { ComponentProps, ComponentType, ReactNode } from "react"

import { isString, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Chart as TanStackChart } from "@tanstack/charts/react/tooltip"
import { createContext, useContext, useRef } from "react"

export type ChartConfig = Record<
  string,
  {
    label?: ReactNode
    icon?: ComponentType<{ className?: string }>
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: { light: string; dark: string } }
  )
>

const ChartContext = createContext<ChartConfig | null>(null)

const styles = stylex.create({
  container: { minInlineSize: 0, inlineSize: "100%" },
  chart: { minInlineSize: 0, inlineSize: "100%" },
  tooltip: {
    boxShadow: tokens["--shadow-md"],
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--popover-foreground"],
    display: "grid",
    fontSize: "0.75rem",
    gap: `calc(${tokens["--spacing"]} * 1.5)`,
    padding: `calc(${tokens["--spacing"]} * 2)`,
  },
  label: { fontWeight: 600 },
  icon: {
    inlineSize: `calc(${tokens["--spacing"]} * 3)`,
    blockSize: `calc(${tokens["--spacing"]} * 3)`,
    flexShrink: 0,
  },
  row: {
    alignItems: "center",
    display: "flex",
    gap: `calc(${tokens["--spacing"]} * 2)`,
  },
  value: { fontFamily: tokens["--font-mono"], marginInlineStart: "auto" },
  legend: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: `calc(${tokens["--spacing"]} * 4)`,
    justifyContent: "center",
  },
  indicator: (color: string) => ({
    backgroundColor: color,
    color,
    flexShrink: 0,
  }),
  dot: {
    blockSize: "0.625rem",
    borderRadius: "0.125rem",
    inlineSize: "0.625rem",
  },
  line: { alignSelf: "stretch", inlineSize: "0.25rem" },
  dashed: {
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderInlineStartStyle: "dashed",
    borderInlineStartWidth: 2,
    inlineSize: 0,
  },
})

export function useChart() {
  const context = useContext(ChartContext)

  if (!context) throw new Error("useChart must be used within a ChartContainer")

  const config = context

  function getColor(key: string) {
    const item = config[key]

    if (item?.theme)
      return `light-dark(${item.theme.light}, ${item.theme.dark})`

    return item?.color
  }

  return { config, getColor }
}

export function ChartContainer({
  config,
  className,
  xstyle,
  children,
  ...props
}: StyleXComponentProps<ComponentProps<"div">, { config: ChartConfig }>) {
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart-container"
        {...props}
        {...stylexProps(className, styles.container, xstyle)}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

const chartTheme = {
  foreground: tokens["--foreground"],
  muted: tokens["--muted-foreground"],
  grid: tokens["--border"],
  background: "transparent",
  palette: [
    tokens["--chart-1"],
    tokens["--chart-2"],
    tokens["--chart-3"],
    tokens["--chart-4"],
    tokens["--chart-5"],
  ],
} satisfies Partial<ChartTheme>

function withChartTheme<Spec extends { theme?: Partial<ChartTheme> }>(
  spec: Spec,
) {
  return { ...spec, theme: { ...chartTheme, ...spec.theme } }
}

function getStringField<Value>(
  value: Value,
  key: string | undefined,
): string | undefined {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: chart data can contain primitives or null.
  if (!key || value === null || typeof value !== "object") return undefined

  const field: unknown = Object.entries(value).find(
    ([name]) => name === key,
  )?.[1]

  return isString(field) ? field : undefined
}

export function Chart<
  TDatum,
  TXValue extends ChartValue = ChartValue,
  TYValue extends ChartValue = ChartValue,
>({
  className,
  xstyle,
  definition,
  onRender,
  onFocusChange,
  defaultIndex,
  ...props
}: StyleXComponentProps<
  TanStackChartProps<TDatum, TXValue, TYValue>,
  { defaultIndex?: number }
>) {
  const interaction = useRef<ChartInteractionController<
    TDatum,
    TXValue,
    TYValue
  > | null>(null)

  const cleanup = useRef<(() => void) | null>(null)
  const initialIndex = useRef(defaultIndex)
  const initialFocusApplied = useRef(false)
  const initialFocusActive = useRef(false)
  const applyingFocus = useRef(false)
  const focusTrigger = useRef<Element | null>(null)

  function setChartRef(node: HTMLDivElement | null) {
    cleanup.current?.()
    cleanup.current = null

    if (!node) return
    const chartNode = node
    const doc = chartNode.ownerDocument

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        (event.composedPath().includes(chartNode) ||
          (initialFocusActive.current && event.target === focusTrigger.current))
      ) {
        initialFocusActive.current = false
        interaction.current?.setControlledFocus(null)
      }
    }

    doc.addEventListener("keydown", handleKeyDown)
    cleanup.current = () => doc.removeEventListener("keydown", handleKeyDown)
  }

  const themedDefinition =
    "chart" in definition
      ? {
          ...definition,
          chart(context: ChartBuildContext) {
            return withChartTheme(
              definition.chart({
                ...context,
                defaultTheme: { ...context.defaultTheme, ...chartTheme },
              }),
            )
          },
        }
      : withChartTheme(definition)

  return (
    <div ref={setChartRef} data-slot="chart">
      <TanStackChart
        {...props}
        definition={themedDefinition}
        onFocusChange={(point) => {
          if (applyingFocus.current) {
            if (point) {
              initialFocusApplied.current = true
              initialFocusActive.current = true
            }
          } else {
            if (point) initialFocusApplied.current = true

            initialFocusActive.current = false
          }

          onFocusChange?.(point)
        }}
        onRender={(context) => {
          const recreated =
            interaction.current !== null &&
            interaction.current !== context.interaction

          const index = initialIndex.current

          interaction.current = context.interaction

          if (
            (!initialFocusApplied.current ||
              (recreated && initialFocusActive.current)) &&
            index !== undefined &&
            Number.isInteger(index) &&
            index >= 0
          ) {
            const point = context.scene.points[index]

            if (point) {
              if (!initialFocusApplied.current)
                focusTrigger.current =
                  context.container.ownerDocument.activeElement

              applyingFocus.current = true

              try {
                context.interaction.setControlledFocus(point, {
                  source: "programmatic",
                })
              } finally {
                applyingFocus.current = false
              }
            }
          }

          onRender?.(context)
        }}
        {...stylexProps(className, styles.chart, xstyle)}
      />
    </div>
  )
}

export type ChartTooltipContentProps<
  TDatum,
  TXValue extends ChartValue = ChartValue,
  TYValue extends ChartValue = ChartValue,
> = StyleXComponentProps<
  ComponentProps<"div">,
  {
    context: ChartTooltipBodyRenderContext<TDatum, TXValue, TYValue>
    indicator?: "dot" | "line" | "dashed"
    hideLabel?: boolean
    hideIndicator?: boolean
    nameKey?: string
    labelKey?: string
    getRowPayload?: (
      row: ChartTooltipRow,
      index: number,
      context: ChartTooltipBodyRenderContext<TDatum, TXValue, TYValue>,
    ) => object | undefined
    color?: string
    formatter?: (
      value: string,
      name: string,
      index: number,
      context: ChartTooltipBodyRenderContext<TDatum, TXValue, TYValue>,
    ) => ReactNode
    labelFormatter?: (
      label: ReactNode,
      context: ChartTooltipBodyRenderContext<TDatum, TXValue, TYValue>,
    ) => ReactNode
  }
>

export function ChartTooltipContent<
  TDatum,
  TXValue extends ChartValue = ChartValue,
  TYValue extends ChartValue = ChartValue,
>({
  context,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  nameKey,
  labelKey,
  getRowPayload,
  color: indicatorColor,
  formatter,
  labelFormatter,
  className,
  xstyle,
  ...props
}: ChartTooltipContentProps<TDatum, TXValue, TYValue>) {
  const { config, getColor } = useChart()
  const { content } = context

  if (isString(content)) {
    return (
      <div
        data-slot="chart-tooltip-content"
        {...props}
        {...stylexProps(className, styles.tooltip, xstyle)}
      >
        {content}
      </div>
    )
  }

  const labelValue = getStringField(context.primaryPoint?.datum, labelKey)

  const label = labelValue
    ? (config[labelValue]?.label ?? labelValue)
    : content.title

  return (
    <div
      data-slot="chart-tooltip-content"
      {...props}
      {...stylexProps(className, styles.tooltip, xstyle)}
    >
      {!hideLabel && label != null ? (
        <div data-slot="chart-tooltip-label" {...stylex.props(styles.label)}>
          {labelFormatter ? labelFormatter(label, context) : label}
        </div>
      ) : null}
      {content.rows.map((row, index) => {
        const matchingPoints = context.points.filter(
          (point) => point.groupLabel === row.label,
        )

        const point =
          context.points.length === 1
            ? context.points[0]
            : matchingPoints.length === 1
              ? matchingPoints[0]
              : undefined

        const payload = getRowPayload
          ? getRowPayload(row, index, context)
          : point?.datum

        const key =
          getStringField(row, nameKey) ??
          getStringField(payload, nameKey) ??
          row.label

        const item = config[key] ?? config[row.label]
        const Icon = item?.icon

        const color =
          indicatorColor ??
          getColor(key) ??
          getColor(row.label) ??
          row.color ??
          content.color ??
          tokens["--muted-foreground"]

        return (
          <div
            data-slot="chart-tooltip-row"
            key={row.label}
            {...stylex.props(styles.row)}
          >
            {!hideIndicator ? (
              Icon ? (
                <Icon aria-hidden="true" {...stylex.props(styles.icon)} />
              ) : (
                <span
                  aria-hidden="true"
                  data-slot="chart-tooltip-indicator"
                  data-indicator={indicator}
                  {...stylex.props(styles.indicator(color), styles[indicator])}
                />
              )
            ) : null}
            {formatter ? (
              formatter(row.value, key, index, context)
            ) : (
              <>
                <span>{item?.label ?? row.label}</span>
                <span
                  data-slot="chart-tooltip-value"
                  {...stylex.props(styles.value)}
                >
                  {row.value}
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export interface ChartLegendItem {
  name: string
  color?: string
  payload?: object
}

export function ChartLegendContent({
  items,
  hideIcon = false,
  nameKey,
  className,
  xstyle,
  ...props
}: StyleXComponentProps<
  ComponentProps<"div">,
  { items: readonly ChartLegendItem[]; hideIcon?: boolean; nameKey?: string }
>) {
  const { config, getColor } = useChart()

  return (
    <div
      data-slot="chart-legend-content"
      {...props}
      {...stylexProps(className, styles.legend, xstyle)}
    >
      {items.map((entry) => {
        const key =
          getStringField(entry, nameKey) ??
          getStringField(entry.payload, nameKey) ??
          entry.name

        const item = config[key] ?? config[entry.name]
        const Icon = item?.icon

        const color =
          getColor(key) ??
          getColor(entry.name) ??
          entry.color ??
          tokens["--muted-foreground"]

        return (
          <div key={entry.name} {...stylex.props(styles.row)}>
            {Icon && !hideIcon ? (
              <Icon aria-hidden="true" {...stylex.props(styles.icon)} />
            ) : (
              <span
                aria-hidden="true"
                {...stylex.props(styles.indicator(color), styles.dot)}
              />
            )}
            <span>{item?.label ?? entry.name}</span>
          </div>
        )
      })}
    </div>
  )
}
