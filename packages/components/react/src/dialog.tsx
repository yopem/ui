"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { Icon } from "@yopem-ui/react-icons"
import { cn, cva, type VariantProps } from "@yopem-ui/utils"

export const Dialog = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export const DialogTrigger = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

export const DialogPortal = ({
  ...props
}: React.ComponentProps<typeof Portal>) => {
  return <Portal data-slot="dialog-portal" {...props} />
}

export const DialogCloseTrigger = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.CloseTrigger>) => {
  return (
    <DialogPrimitive.CloseTrigger data-slot="dialog-close-trigger" {...props} />
  )
}

export const DialogPositioner = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Positioner>) => {
  return <DialogPrimitive.Positioner data-slot="dialog-positioner" {...props} />
}

export const DialogBackDrop = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) => {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  )
}
export const dialogVariants = cva(
  cn(
    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 gap-4 overflow-y-auto p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
    "lg:data-[state=open]:animate-in lg:data-[state=closed]:animate-out lg:data-[state=closed]:fade-out-0 lg:data-[state=open]:fade-in-0 lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:slide-out-to-left-1/2 lg:data-[state=closed]:slide-out-to-top-[48%] lg:data-[state=open]:slide-in-from-left-1/2 lg:data-[state=open]:slide-in-from-top-[48%] lg:top-[50%] lg:left-[50%] lg:w-full lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%] lg:rounded-lg lg:border lg:duration-200",
  ),
  {
    variants: {
      side: {
        top: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 max-h-[80dvh] rounded-b-lg border-b lg:h-fit",
        bottom:
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 max-h-[80dvh] rounded-t-lg border-t lg:h-fit",
        left: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 rounded-r-lg border-r sm:max-w-sm lg:h-fit",
        right:
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 rounded-l-lg border-l sm:max-w-sm lg:h-fit",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  },
)

export const DialogContent = ({
  side = "bottom",
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogVariants>) => {
  return (
    <DialogPortal>
      <DialogBackDrop />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogVariants({ side }), className)}
        {...props}
      >
        {children}
        <DialogPrimitive.CloseTrigger className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
          <Icon name="X" className="size-4 cursor-pointer" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.CloseTrigger>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export const DialogHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  )
}

export const DialogFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className,
      )}
      {...props}
    />
  )
}

export const DialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-foreground text-lg font-semibold", className)}
      {...props}
    />
  )
}

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}
