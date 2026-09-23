"use client"

import * as stylex from "@stylexjs/stylex"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  DollarSignIcon,
  PercentIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/toolbar"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const items = [
  { label: "Helvetica", value: "helvetica" },
  { label: "Arial", value: "arial" },
  { label: "Times New Roman", value: "times-new-roman" },
]

export default function Example() {
  return (
    <TooltipProvider>
      <Toolbar>
        <ToggleGroup
          {...stylex.props(exampleStyles.example1)}
          defaultValue={["left"]}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Align left"
                  render={<ToggleGroupItem value="left" />}
                >
                  <AlignLeftIcon {...stylex.props(exampleStyles.icon)} />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Align left</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Align center"
                  render={
                    <ToggleGroupItem
                      aria-label="Toggle center"
                      value="center"
                    />
                  }
                >
                  <AlignCenterIcon {...stylex.props(exampleStyles.icon)} />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Align center</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Align right"
                  render={
                    <ToggleGroupItem aria-label="Toggle right" value="right" />
                  }
                >
                  <AlignRightIcon {...stylex.props(exampleStyles.icon)} />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Align right</TooltipPopup>
          </Tooltip>
        </ToggleGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Format as currency"
                  render={<Button size="icon" variant="ghost" />}
                >
                  <DollarSignIcon {...stylex.props(exampleStyles.icon2)} />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Format as currency</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Format as percent"
                  render={<Button size="icon" variant="ghost" />}
                >
                  <PercentIcon {...stylex.props(exampleStyles.icon2)} />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Format as percent</TooltipPopup>
          </Tooltip>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Select defaultValue="helvetica" items={items}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <ToolbarButton
                    render={
                      <SelectTrigger aria-label="Select font">
                        <SelectValue />
                      </SelectTrigger>
                    }
                  />
                }
              />
              <TooltipPopup sideOffset={8}>
                Select a different font
              </TooltipPopup>
            </Tooltip>
            <SelectPopup>
              {items.map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <ToolbarButton render={<Button />}>Save</ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
    </TooltipProvider>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  icon2: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    borderStyle: "none",
    padding: "0px",
  },
})
