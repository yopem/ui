import * as React from "react"
import { ark } from "@ark-ui/react/factory"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

export const Breadcrumb = ({ ...props }: React.ComponentProps<"nav">) => {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

export const BreadcrumbList = ({
  className,
  ...props
}: React.ComponentProps<"ol">) => {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className,
      )}
      {...props}
    />
  )
}

export const BreadcrumbItem = ({
  className,
  ...props
}: React.ComponentProps<"li">) => {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

export const BreadcrumbLink = ({
  asChild,
  className,
  ...props
}: React.ComponentProps<typeof ark.a> & {
  asChild?: boolean
}) => {
  return (
    <ark.a
      asChild={asChild}
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

export const BreadcrumbPage = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  )
}

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <Icon name="ChevronRight" />}
    </li>
  )
}

export const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <Icon name="MoreHorizontal" className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}
