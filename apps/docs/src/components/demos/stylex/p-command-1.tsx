"use client"

import * as stylex from "@stylexjs/stylex"
import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from "lucide-react"
import { Fragment, useEffect, useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/stylex/command"
import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"

export interface Item {
  value: string
  label: string
  shortcut?: string
}

export interface Group {
  value: string
  items: Item[]
}

const suggestions: Item[] = [
  { label: "Linear", shortcut: "⌘L", value: "linear" },
  { label: "Figma", shortcut: "⌘F", value: "figma" },
  { label: "Slack", shortcut: "⌘S", value: "slack" },
  { label: "YouTube", shortcut: "⌘Y", value: "youtube" },
  { label: "Raycast", shortcut: "⌘R", value: "raycast" },
]

const commands: Item[] = [
  { label: "Clipboard History", shortcut: "⌘⇧C", value: "clipboard-history" },
  { label: "Import Extension", shortcut: "⌘I", value: "import-extension" },
  { label: "Create Snippet", shortcut: "⌘N", value: "create-snippet" },
  { label: "System Preferences", shortcut: "⌘,", value: "system-preferences" },
  { label: "Window Management", shortcut: "⌘⇧W", value: "window-management" },
]

const groupedItems: Group[] = [
  { items: suggestions, value: "Suggestions" },
  { items: commands, value: "Commands" },
]

export default function Particle() {
  const [open, setOpen] = useState(false)

  function handleItemClick(_item: Item) {
    setOpen(false)
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogTrigger render={<Button variant="outline" />}>
        Open Command Palette
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>J</Kbd>
        </KbdGroup>
      </CommandDialogTrigger>
      <CommandDialogPopup>
        <Command items={groupedItems}>
          <CommandInput placeholder="Search for apps and commands..." />
          <CommandPanel>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList>
              {(group: Group, _index: number) => (
                <Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: Item) => (
                        <CommandItem
                          key={item.value}
                          onClick={() => handleItemClick(item)}
                          value={item.value}
                        >
                          <span {...stylex.props(demoStyles.demo1)}>
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          )}
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </Fragment>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <div {...stylex.props(demoStyles.demo2)}>
              <div {...stylex.props(demoStyles.demo3)}>
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon {...stylex.props(demoStyles.icon)} />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon {...stylex.props(demoStyles.icon)} />
                  </Kbd>
                </KbdGroup>
                <span>Navigate</span>
              </div>
              <div {...stylex.props(demoStyles.demo3)}>
                <Kbd>
                  <CornerDownLeftIcon {...stylex.props(demoStyles.icon)} />
                </Kbd>
                <span>Open</span>
              </div>
            </div>
            <div {...stylex.props(demoStyles.demo3)}>
              <Kbd>Esc</Kbd>
              <span>Close</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: "0.75rem",
    inlineSize: "0.75rem",
    flexShrink: 0,
    pointerEvents: "none",
  },
  demo1: {
    flex: "1",
  },
  demo2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  demo3: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
})
