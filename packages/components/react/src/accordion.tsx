"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "@ark-ui/react/accordion"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

export const Accordion = AccordionPrimitive.Root

export const AccordionItem = ({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) => (
  <AccordionPrimitive.Item
    data-slot="accordion-item"
    className={cn("border-b last:border-b-0", className)}
    {...props}
  />
)

export const AccordionItemTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.ItemTrigger>) => (
  <AccordionPrimitive.ItemTrigger
    data-slot="accordion-item-trigger"
    className={cn(
      "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
      className,
    )}
    {...props}
  >
    {children}
    <Icon
      name="ChevronDown"
      className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
    />
  </AccordionPrimitive.ItemTrigger>
)

export const AccordionItemContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.ItemContent>) => (
  <AccordionPrimitive.ItemContent
    data-slot="accordion-content"
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
    {...props}
  >
    <div className={cn("pt-0 pb-4", className)}>{children}</div>
  </AccordionPrimitive.ItemContent>
)
