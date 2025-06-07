"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@ark-ui/react/radio-group"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

export const RadioGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) => {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

export const RadioGroupLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Label>) => {
  return (
    <RadioGroupPrimitive.Label
      className={cn("text-foreground text-sm font-medium", className)}
      {...props}
    />
  )
}

export const RadioGroupItem = ({
  className,
  value,
  id,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  id: string
  children: React.ReactNode
}) => {
  return (
    <RadioGroupPrimitive.Item
      id={id}
      value={value}
      className={cn("group flex items-center space-x-2", className)}
      {...props}
    >
      <RadioGroupPrimitive.ItemControl
        className={cn(
          "border-input bg-background ring-offset-background focus-visible:ring-ring flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <Icon
          name="Check"
          className={cn(
            "bg-primary block size-2 rounded-full opacity-0 transition-opacity group-data-[state=checked]:opacity-100",
          )}
        />
      </RadioGroupPrimitive.ItemControl>
      <RadioGroupPrimitive.ItemText className="text-foreground group-data-[disabled]:text-muted-foreground text-sm font-normal group-data-[disabled]:cursor-not-allowed">
        {children}
      </RadioGroupPrimitive.ItemText>
      <RadioGroupPrimitive.ItemHiddenInput />
    </RadioGroupPrimitive.Item>
  )
}
