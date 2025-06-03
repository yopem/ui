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
  overlap: true,
  gap: 16,
}

export function useToast(config: Partial<CreateToasterProps> = {}) {
  const toaster = createToaster({ ...defaultConfig, ...config })

  const toast = (options: Options) => toaster.create(options)

  const getToastTypeStyles = (type?: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-700",
          title: "text-white",
          description: "text-white",
        }
      case "error":
        return {
          bg: "bg-red-700",
          title: "text-white",
          description: "text-white",
        }
      case "info":
        return {
          bg: "bg-blue-700",
          title: "text-white",
          description: "text-white",
        }
      case "loading":
        return {
          bg: "bg-gray-700",
          title: "text-white",
          description: "text-white",
        }
      default:
        return {
          bg: "bg-background",
          title: "text-foreground",
          description: "text-muted-foreground",
        }
    }
  }

  const Toaster = () => (
    <ToasterPrimitive toaster={toaster}>
      {(t) => {
        const styles = getToastTypeStyles(t.type)

        return (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              "animate-in fade-in slide-in-from-bottom-4 pointer-events-auto relative flex w-lg max-w-md items-start gap-4 rounded-lg py-4 pr-6 pl-4 shadow-lg transition-all duration-300 ease-out",
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

            {/* Action */}
            {t.action && (
              <ToastPrimitive.ActionTrigger className="text-primary self-center text-sm font-medium hover:underline">
                {t.action.label}
              </ToastPrimitive.ActionTrigger>
            )}

            {/* Close */}
            <ToastPrimitive.CloseTrigger className="hover:text-accent absolute top-2 right-2 rounded-md p-1">
              <Icon name="X" className="text-muted-foreground size-4" />
            </ToastPrimitive.CloseTrigger>
          </ToastPrimitive.Root>
        )
      }}
    </ToasterPrimitive>
  )

  return { toast, Toaster }
}
