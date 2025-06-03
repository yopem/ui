"use client"

import {
  createToaster,
  Toaster as ToasterPrimitive,
  Toast as ToastPrimitive,
  type CreateToasterProps,
} from "@ark-ui/react/toast"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"
import type { Options } from "@zag-js/toast"

const defaultConfig: CreateToasterProps = {
  placement: "bottom-end",
  overlap: false,
  gap: 16,
}

export function useToast(config: Partial<CreateToasterProps> = {}) {
  const toaster = createToaster({ ...defaultConfig, ...config })

  const toast = (options: Options) => {
    if (options.id) toaster.remove(options.id)
    return toaster.create(options)
  }

  const getToastTypeStyles = (type?: string) => {
    let styles: {
      bg: string
      title: string
      description: string
    }

    if (type === "destructive") {
      styles = {
        bg: "bg-destructive",
        title: "text-white",
        description: "text-white",
      }
    } else {
      styles = {
        bg: "bg-background",
        title: "text-foreground",
        description: "text-muted-foreground",
      }
    }

    return styles
  }

  const Toaster = () => (
    <ToasterPrimitive toaster={toaster}>
      {(t) => {
        const styles = getToastTypeStyles(t.type)

        return (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              "group data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-4 pointer-events-auto relative flex w-lg max-w-md items-start gap-4 rounded-lg py-4 pr-8 pl-4 shadow-lg transition-all ease-in-out",
              styles.bg,
            )}
          >
            {/* Content */}
            <div className="flex flex-1 flex-col">
              {t.title && (
                <ToastPrimitive.Title
                  className={cn("text-sm font-semibold", styles.title)}
                >
                  {t.title}
                </ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description
                  className={cn("mt-1 text-sm", styles.description)}
                >
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>

            {t.action && (
              <ToastPrimitive.ActionTrigger className="text-primary self-end text-sm font-medium hover:underline">
                {t.action.label}
              </ToastPrimitive.ActionTrigger>
            )}

            <ToastPrimitive.CloseTrigger
              className={cn(
                "absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:scale-105",
                t.type === "destructive"
                  ? "hover:text-white"
                  : "hover:text-foreground",
              )}
            >
              <Icon
                name="X"
                className={cn(
                  "size-4 transition-all duration-150",
                  t.type === "destructive"
                    ? "text-white"
                    : "text-muted-foreground",
                )}
              />
            </ToastPrimitive.CloseTrigger>
          </ToastPrimitive.Root>
        )
      }}
    </ToasterPrimitive>
  )

  return { toast, Toaster }
}
