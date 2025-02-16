"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "@ark-ui/react/accordion"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionItemTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.ItemTrigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.ItemTrigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.ItemTrigger
    ref={ref}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className,
    )}
    {...props}
  >
    {children}
    <Icon
      name="ChevronDown"
      className="size-4 shrink-0 transition-transform duration-200"
    />
  </AccordionPrimitive.ItemTrigger>
))
AccordionItemTrigger.displayName = AccordionPrimitive.ItemTrigger.displayName

const AccordionItemContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.ItemContent>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.ItemContent>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.ItemContent
    ref={ref}
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all"
    {...props}
  >
    <div className={cn("pt-0 pb-4", className)}>{children}</div>
  </AccordionPrimitive.ItemContent>
))

AccordionItemContent.displayName = AccordionPrimitive.ItemContent.displayName

export { Accordion, AccordionItem, AccordionItemTrigger, AccordionItemContent }
