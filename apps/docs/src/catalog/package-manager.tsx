import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@registry/components/ui/toggle-group"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { TerminalIcon } from "lucide-react"
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react"

import {
  convertPackageManagerCommand,
  packageManagers as managers,
  type PackageManager,
} from "@/catalog/source-code"

const PackageManagerContext = createContext<PackageManager>("Bun")

const PackageManagerSelectionContext = createContext<
  ((manager: PackageManager) => void) | null
>(null)

const managerValues = {
  Bun: ["Bun"],
  npm: ["npm"],
  pnpm: ["pnpm"],
  Yarn: ["Yarn"],
}

function createPackageManagerStore() {
  let manager: PackageManager | undefined
  let notify: (() => void) | undefined

  return {
    getSnapshot(this: void) {
      if (manager) return manager

      try {
        const saved = localStorage.getItem("yopem-package-manager")

        return managers.find((item) => item === saved) ?? "Bun"
      } catch {
        return "Bun"
      }
    },
    select(this: void, value: PackageManager) {
      manager = value

      try {
        localStorage.setItem("yopem-package-manager", value)
      } catch {
        // Keep the selection in memory when browser storage is unavailable.
      }

      notify?.()
    },
    subscribe(this: void, callback: () => void) {
      notify = callback

      return () => {
        notify = undefined
      }
    },
  }
}

function getServerPackageManager(): PackageManager {
  return "Bun"
}

export function PackageManagerProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createPackageManagerStore)

  const manager = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerPackageManager,
  )

  return (
    <PackageManagerContext value={manager}>
      <PackageManagerSelectionContext value={store.select}>
        {children}
      </PackageManagerSelectionContext>
    </PackageManagerContext>
  )
}

export function PackageManagerSwitcher() {
  const hydrated = useHydrated()
  const manager = useContext(PackageManagerContext)
  const select = useContext(PackageManagerSelectionContext)

  const handleChange = useEventCallback((values: string[]) => {
    const selected = managers.find((item) => item === values[0])

    if (selected) select?.(selected)
  })

  return (
    <Box xstyle={styles.switcher}>
      <TerminalIcon
        {...stylex.props(styles.icon)}
        data-slot="terminal-icon"
        aria-hidden="true"
      />
      <ToggleGroup
        xstyle={styles.group}
        aria-label="Package manager"
        disabled={!hydrated}
        size="sm"
        value={managerValues[manager]}
        onValueChange={handleChange}
      >
        {managers.map((item) => (
          <ToggleGroupItem
            key={item}
            value={item}
            aria-label={item}
            xstyle={styles.item}
          >
            {item.toLowerCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Box>
  )
}

export function usePackageManagerCommand(code: string) {
  return convertPackageManagerCommand(code, useContext(PackageManagerContext))
}

const styles = stylex.create({
  switcher: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  icon: {
    blockSize: "1rem",
    inlineSize: "1rem",
    flexShrink: 0,
    color: tokens["--muted-foreground"],
  },
  group: { gap: "0.125rem" },
  item: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    fontWeight: 400,
    blockSize: "1.75rem",
    minInlineSize: "1.75rem",
    paddingInline: "0.5rem",
    borderRadius: tokens["--radius-md"],
    borderColor: {
      default: "transparent",
      "[data-pressed]": tokens["--border"],
    },
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--accent"],
      "[data-pressed]": tokens["--background"],
    },
    color: {
      default: tokens["--muted-foreground"],
      "[data-pressed]": tokens["--foreground"],
    },
  },
})
