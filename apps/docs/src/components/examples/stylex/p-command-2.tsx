"use client"

import type { RefObject } from "react"

import * as stylex from "@stylexjs/stylex"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CircleQuestionMarkIcon,
  CornerDownLeftIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"
// next/link replaced -> anchor
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useAutocompleteFilter } from "@/components/ui/stylex/autocomplete"
import { Button } from "@/components/ui/stylex/button"
import {
  Command,
  CommandCollection,
  CommandCreateHandle,
  CommandDialog,
  CommandDialogPopup,
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
import { EmptyMedia } from "@/components/ui/stylex/empty"
import { Input } from "@/components/ui/stylex/input"
import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"
import { ScrollArea } from "@/components/ui/stylex/scroll-area"
import { Skeleton } from "@/components/ui/stylex/skeleton"
import { Spinner } from "@/components/ui/stylex/spinner"

interface Item {
  value: string
  label: string
  shortcut?: string
  keywords?: string[]
}

interface Group {
  value: string
  items: Item[]
}

const commandGroups: Group[] = [
  {
    items: [
      {
        keywords: ["dash"],
        label: "Dashboard",
        shortcut: "d",
        value: "dashboard",
      },
      {
        keywords: ["proj"],
        label: "Projects",
        shortcut: "p",
        value: "projects",
      },
      { keywords: ["team"], label: "Team", shortcut: "t", value: "team" },
    ],
    value: "Pages",
  },
  {
    items: [
      {
        keywords: ["prof"],
        label: "Profile",
        shortcut: "p s",
        value: "profile",
      },
      {
        keywords: ["acc"],
        label: "Account",
        shortcut: "a s",
        value: "account",
      },
      {
        keywords: ["pref"],
        label: "Preferences",
        shortcut: "p r",
        value: "preferences",
      },
    ],
    value: "Settings",
  },
  {
    items: [
      {
        keywords: ["docs"],
        label: "Documentation",
        shortcut: "d o",
        value: "docs",
      },
      {
        keywords: ["sup"],
        label: "Support",
        shortcut: "s u",
        value: "support",
      },
      {
        keywords: ["feed"],
        label: "Feedback",
        shortcut: "f b",
        value: "feedback",
      },
    ],
    value: "Help",
  },
]

const MOCK_AI_RESPONSE = `To create a new project, navigate to the Projects page and click the "New Project" button in the top right corner. You'll be prompted to enter a project name and description.

Once created, you can invite team members by clicking the "Share" button and entering their email addresses. Team members will receive an invitation link via email or you can add them manually by clicking the "Add Team Member" button in the project settings.

You can customize project settings at any time by clicking the settings icon in the project header. For more information, see the Project Settings documentation.`

const MOCK_REFERENCE_LINKS = [
  { title: "Creating Projects", url: "/docs/projects/create" },
  { title: "Team Collaboration", url: "/docs/team/collaborate" },
  { title: "Project Settings", url: "/docs/projects/settings" },
]

const commandHandle: ReturnType<typeof CommandCreateHandle> =
  CommandCreateHandle()

interface AIState {
  mode: boolean
  query: string
  submittedQuery: string
  response: string
  referenceLinks: { title: string; url: string }[]
  isGenerating: boolean
  error: string | null
}

const initialAIState: AIState = {
  error: null,
  isGenerating: false,
  mode: false,
  query: "",
  referenceLinks: [],
  response: "",
  submittedQuery: "",
}

function markdownToSafeHTML(markdown: string): string {
  // Simple markdown to HTML converter for example purposes
  return markdown
    .split("\n\n")
    .map(
      (para) =>
        `<p class="${stylex.props(exampleStyles.responseParagraph).className}">${para}</p>`,
    )
    .join("")
}

function useCommandExample() {
  const [open, setOpen] = useState(false)
  const [aiState, setAIState] = useState<AIState>(initialAIState)
  const [searchQuery, setSearchQuery] = useState("")
  const aiInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [commandResetKey, setCommandResetKey] = useState(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const resetAIState = useCallback(() => {
    abortControllerRef.current?.abort()
    setAIState(initialAIState)
  }, [])

  const handleItemClick = useCallback(() => {
    setOpen(false)
  }, [])

  const handleBackToSearch = useCallback(() => {
    resetAIState()
    setSearchQuery("")
    setCommandResetKey((k) => k + 1)
    searchInputRef.current?.focus()
  }, [resetAIState])

  const handleGenerateAI = useCallback(
    async (queryOverride?: string) => {
      const query = queryOverride || aiState.query
      if (!query.trim()) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setAIState((prev) => ({
        ...prev,
        error: null,
        isGenerating: true,
        query: "",
        referenceLinks: [],
        response: "",
        submittedQuery: query,
      }))

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, 1500)
          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeout)
            reject(new Error("aborted"))
          })
        })

        if (controller.signal.aborted) return

        setAIState((prev) => ({
          ...prev,
          isGenerating: false,
          referenceLinks: MOCK_REFERENCE_LINKS,
          response: MOCK_AI_RESPONSE,
        }))
      } catch (error) {
        if (error instanceof Error && error.message === "aborted") {
          return
        }

        if (controller.signal.aborted) return

        setAIState((prev) => ({
          ...prev,
          error: "Failed to generate response. Please try again.",
          isGenerating: false,
        }))
      }
    },
    [aiState.query],
  )

  const handleAskAI = useCallback(() => {
    const currentQuery = searchQuery
    setSearchQuery("")

    if (currentQuery.trim()) {
      setAIState((prev) => ({ ...prev, mode: true }))
      handleGenerateAI(currentQuery)
    } else {
      setAIState((prev) => ({ ...prev, mode: true, query: "" }))
      aiInputRef.current?.focus()
    }
  }, [searchQuery, handleGenerateAI])

  const { contains } = useAutocompleteFilter({ sensitivity: "base" })

  const filterItem = useCallback(
    (itemValue: unknown, query: string): boolean => {
      if (
        typeof itemValue !== "object" ||
        itemValue === null ||
        !("label" in itemValue) ||
        typeof itemValue.label !== "string" ||
        !("value" in itemValue) ||
        typeof itemValue.value !== "string"
      ) {
        return false
      }

      if (contains(itemValue.label, query)) {
        return true
      }

      if (contains(itemValue.value, query)) {
        return true
      }

      if (
        "keywords" in itemValue &&
        Array.isArray(itemValue.keywords) &&
        itemValue.keywords.some(
          (keyword: unknown) =>
            typeof keyword === "string" && contains(keyword, query),
        )
      ) {
        return true
      }

      return false
    },
    [contains],
  )

  useEffect(() => {
    if (!open || !aiState.mode) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        handleBackToSearch()
      }
    }

    document.addEventListener("keydown", handleEscape, true)
    return () => document.removeEventListener("keydown", handleEscape, true)
  }, [open, aiState.mode, handleBackToSearch])

  useEffect(() => {
    if (aiState.mode && !aiState.isGenerating) {
      aiInputRef.current?.focus()
    }
  }, [aiState.mode, aiState.isGenerating])

  const hasResults = useMemo(
    () =>
      !searchQuery.trim() ||
      commandGroups.some((group) =>
        group.items.some((item) => filterItem(item, searchQuery)),
      ),
    [searchQuery, filterItem],
  )

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (!newOpen) {
        setSearchQuery("")
        resetAIState()
      }
    },
    [resetAIState],
  )

  function handleOpen() {
    setOpen(true)
  }

  function handleSearchQueryChange(query: string) {
    setSearchQuery(query)
  }

  function handleAIQueryChange(query: string) {
    setAIState((prev) => ({ ...prev, query }))
  }

  return {
    aiInputRef,
    aiState,
    commandResetKey,
    filterItem,
    handleAIQueryChange,
    handleAskAI,
    handleBackToSearch,
    handleGenerateAI,
    handleItemClick,
    handleOpen,
    handleOpenChange,
    handleSearchQueryChange,
    hasResults,
    open,
    searchInputRef,
    searchQuery,
  }
}

interface SearchCommandProps {
  commandResetKey: number
  filterItem: (itemValue: unknown, query: string) => boolean
  hasResults: boolean
  onAskAI: () => void
  onItemClick: () => void
  onSearchQueryChange: (query: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  searchQuery: string
}

function SearchCommand({
  commandResetKey,
  filterItem,
  hasResults,
  onAskAI,
  onItemClick,
  onSearchQueryChange,
  searchInputRef,
  searchQuery,
}: SearchCommandProps) {
  return (
    <Command filter={filterItem} items={commandGroups} key={commandResetKey}>
      <div {...stylex.props(exampleStyles.report1)}>
        <CommandInput
          {...stylex.props(exampleStyles.commandInput)}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault()
              onAskAI()
            }
            if (event.key === "Enter" && !hasResults && searchQuery.trim()) {
              event.preventDefault()
              onAskAI()
            }
          }}
          placeholder="Type a command or search..."
          ref={searchInputRef}
          value={searchQuery}
        />
        <Button
          {...stylex.props(exampleStyles.example1)}
          onClick={onAskAI}
          size="sm"
          variant="ghost"
        >
          <SparklesIcon
            {...stylex.props(exampleStyles.icon, exampleStyles.example2)}
          />
          Ask AI
          <Kbd {...stylex.props(exampleStyles.example3)}>Tab</Kbd>
        </Button>
      </div>
      <CommandPanel>
        <CommandEmpty {...stylex.props(exampleStyles.example4)}>
          {searchQuery.trim() && (
            <div {...stylex.props(exampleStyles.example5)}>
              <EmptyMedia variant="icon">
                <SearchIcon {...stylex.props(exampleStyles.icon2)} />
              </EmptyMedia>
              <p>No results found.</p>
              <p>
                Press <Kbd>Enter</Kbd> to ask AI about:
                <br />{" "}
                <strong {...stylex.props(exampleStyles.example6)}>
                  {searchQuery}
                </strong>
              </p>
            </div>
          )}
        </CommandEmpty>
        <CommandList>
          {(group: Group) => (
            <Fragment key={group.value}>
              <CommandGroup items={group.items}>
                <CommandGroupLabel>{group.value}</CommandGroupLabel>
                <CommandCollection>
                  {(item: Item) => (
                    <CommandItem
                      key={item.value}
                      onClick={onItemClick}
                      value={item}
                    >
                      <span {...stylex.props(exampleStyles.example7)}>
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
        {hasResults ? (
          <>
            <div {...stylex.props(exampleStyles.example8)}>
              <div {...stylex.props(exampleStyles.example9)}>
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon {...stylex.props(exampleStyles.icon3)} />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon {...stylex.props(exampleStyles.icon3)} />
                  </Kbd>
                </KbdGroup>
                <span>Navigate</span>
              </div>
              <div {...stylex.props(exampleStyles.example9)}>
                <Kbd>
                  <CornerDownLeftIcon {...stylex.props(exampleStyles.icon3)} />
                </Kbd>
                <span>Open</span>
              </div>
            </div>
            <div {...stylex.props(exampleStyles.example9)}>
              <Kbd>Esc</Kbd>
              <span>Close</span>
            </div>
          </>
        ) : (
          <div {...stylex.props(exampleStyles.example10)}>
            <Kbd>Esc</Kbd>
            <span>Close</span>
          </div>
        )}
      </CommandFooter>
    </Command>
  )
}

interface AICommandProps {
  aiInputRef: RefObject<HTMLInputElement | null>
  aiState: AIState
  onBackToSearch: () => void
  onGenerateAI: (queryOverride?: string) => Promise<void>
  onQueryChange: (query: string) => void
}

function AICommand({
  aiInputRef,
  aiState,
  onBackToSearch,
  onGenerateAI,
  onQueryChange,
}: AICommandProps) {
  return (
    <Command>
      <div {...stylex.props(exampleStyles.report2)}>
        <div {...stylex.props(exampleStyles.example11)}>
          <div {...stylex.props(exampleStyles.example12)}>
            <div
              aria-hidden="true"
              {...stylex.props(exampleStyles.report3)}
              data-slot="autocomplete-start-addon"
            >
              <SparklesIcon {...stylex.props(exampleStyles.addonIcon)} />
            </div>
            <Input
              aria-label="AI query input"
              {...stylex.props(exampleStyles.report4)}
              disabled={aiState.isGenerating}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !aiState.isGenerating) {
                  onGenerateAI()
                }
                if (event.key === "Escape") {
                  event.preventDefault()
                  onBackToSearch()
                }
              }}
              placeholder="Ask AI anything…"
              ref={aiInputRef}
              size="lg"
              value={aiState.query}
            />
          </div>
        </div>
        <Button
          {...stylex.props(exampleStyles.example1)}
          onClick={onBackToSearch}
          size="sm"
          variant="ghost"
        >
          <ArrowLeftIcon
            {...stylex.props(exampleStyles.icon, exampleStyles.example2)}
          />
          Back to search
          <Kbd {...stylex.props(exampleStyles.example3)}>Esc</Kbd>
        </Button>
      </div>
      <CommandPanel>
        <ScrollArea overscrollContain scrollbarGutter scrollFade>
          <div {...stylex.props(exampleStyles.example13)}>
            {!aiState.isGenerating && !aiState.response && !aiState.error && (
              <div {...stylex.props(exampleStyles.example14)}>
                <p {...stylex.props(exampleStyles.example15)}>
                  Ask AI anything and press <Kbd>Enter</Kbd> to get started.
                </p>
              </div>
            )}

            {aiState.error && (
              <div
                aria-live="polite"
                {...stylex.props(exampleStyles.example16)}
                role="alert"
              >
                {aiState.error}
              </div>
            )}

            {aiState.isGenerating && (
              <div {...stylex.props(exampleStyles.example17)}>
                <div {...stylex.props(exampleStyles.example18)}>
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example20)} />
                </div>
                <div {...stylex.props(exampleStyles.example18)}>
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example21)} />
                </div>
                <div {...stylex.props(exampleStyles.example18)}>
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example19)} />
                  <Skeleton {...stylex.props(exampleStyles.example22)} />
                </div>
              </div>
            )}

            {aiState.response && !aiState.isGenerating && (
              <>
                <div
                  aria-live="polite"
                  {...stylex.props(exampleStyles.report5)}
                  dangerouslySetInnerHTML={{
                    __html: markdownToSafeHTML(aiState.response),
                  }}
                />
                {aiState.referenceLinks.length > 0 && (
                  <div {...stylex.props(exampleStyles.example23)}>
                    {aiState.referenceLinks.map((link) => (
                      <Button
                        key={link.url}
                        render={<a aria-label={link.title} href={link.url} />}
                        size="sm"
                        variant="secondary"
                      >
                        {link.title}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CommandPanel>

      <CommandFooter>
        {aiState.isGenerating ? (
          <div aria-live="polite" {...stylex.props(exampleStyles.example9)}>
            <div {...stylex.props(exampleStyles.example24)}>
              <Spinner {...stylex.props(exampleStyles.example25)} />
            </div>
            <span {...stylex.props(exampleStyles.report6)}>
              Generating response…
            </span>
          </div>
        ) : aiState.response ? (
          <div {...stylex.props(exampleStyles.example9)}>
            <div {...stylex.props(exampleStyles.example24)}>
              <CircleQuestionMarkIcon
                {...stylex.props(exampleStyles.example25)}
              />
            </div>
            You asked: <span>&quot;{aiState.submittedQuery}&quot;</span>
          </div>
        ) : (
          <div {...stylex.props(exampleStyles.example9)}>
            <Kbd>
              <CornerDownLeftIcon {...stylex.props(exampleStyles.icon3)} />
            </Kbd>
            <span>Ask AI</span>
          </div>
        )}
      </CommandFooter>
    </Command>
  )
}

export default function PCommand2() {
  const example = useCommandExample()

  return (
    <>
      <Button onClick={example.handleOpen} variant="outline">
        Cmdk with AI
      </Button>
      <CommandDialog
        handle={commandHandle}
        onOpenChange={example.handleOpenChange}
        open={example.open}
      >
        <CommandDialogPopup>
          {example.aiState.mode ? (
            <AICommand
              aiInputRef={example.aiInputRef}
              aiState={example.aiState}
              onBackToSearch={example.handleBackToSearch}
              onGenerateAI={example.handleGenerateAI}
              onQueryChange={example.handleAIQueryChange}
            />
          ) : (
            <SearchCommand
              commandResetKey={example.commandResetKey}
              filterItem={example.filterItem}
              hasResults={example.hasResults}
              onAskAI={example.handleAskAI}
              onItemClick={example.handleItemClick}
              onSearchQueryChange={example.handleSearchQueryChange}
              searchInputRef={example.searchInputRef}
              searchQuery={example.searchQuery}
            />
          )}
        </CommandDialogPopup>
      </CommandDialog>
    </>
  )
}

const pulse = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.5 },
})

const exampleStyles = stylex.create({
  icon: {
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  icon2: {
    blockSize: "1.125rem",
    inlineSize: "1.125rem",
    flexShrink: 0,
    pointerEvents: "none",
  },
  icon3: {
    blockSize: "0.75rem",
    inlineSize: "0.75rem",
    flexShrink: 0,
    pointerEvents: "none",
  },
  commandInput: {
    flexGrow: 1,
  },
  addonIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    marginInline: "-0.125rem",
  },
  responseParagraph: {
    lineHeight: "1.625",
    marginBlockStart: 0,
  },
  example1: {
    marginInlineEnd: "calc(0.25rem * 2.5)",
    borderRadius: "calc(var(--radius) - 2px)",
    fontSize: {
      default: "0.875rem",
      "@media (min-width: 40rem)": "0.75rem",
    },
    lineHeight: {
      default: "calc(1.25 / 0.875)",
      "@media (min-width: 40rem)": "calc(1 / 0.75)",
    },
    color: {
      default: null,
      ":not(:hover)": "var(--muted-foreground)",
      "@media (hover: none)": "var(--muted-foreground)",
    },
  },
  example2: {
    inlineSize: {
      default: "calc(0.25rem * 4)",
      "@media (min-width: 40rem)": "calc(0.25rem * 3.5)",
    },
    blockSize: {
      default: "calc(0.25rem * 4)",
      "@media (min-width: 40rem)": "calc(0.25rem * 3.5)",
    },
  },
  example3: {
    marginInlineStart: "calc(0.25rem * 0.5)",
    marginInlineEnd: "calc(0.25rem * -1.5)",
  },
  example4: {
    paddingBlock: {
      default: null,
      ":not(:empty)": "calc(0.25rem * 12)",
    },
  },
  example5: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    overflowWrap: "break-word",
  },
  example6: {
    fontWeight: "500",
    color: "var(--foreground)",
  },
  example7: {
    flex: "1",
  },
  example8: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  example9: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example10: {
    marginInlineStart: "auto",
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example11: {
    flexGrow: 1,
    paddingInline: "calc(0.25rem * 2.5)",
    paddingBlock: "calc(0.25rem * 1.5)",
  },
  example12: {
    position: "relative",
    inlineSize: "100%",
  },
  example13: {
    padding: "calc(0.25rem * 5)",
  },
  example14: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "calc(0.25rem * 12)",
  },
  example15: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example16: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--destructive)",
  },
  example17: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example18: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example19: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "100%",
  },
  example20: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  example21: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(3 / 4 * 100%)",
  },
  example22: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(3 / 5 * 100%)",
  },
  example23: {
    marginBlockStart: "calc(0.25rem * 4)",
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
  example24: {
    display: "flex",
    blockSize: "calc(0.25rem * 5)",
    alignItems: "center",
    justifyContent: "center",
  },
  example25: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
  },
  report1: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  report2: {
    display: "flex",
    alignItems: "center",
  },
  report3: {
    pointerEvents: "none",
    position: "absolute",
    insetBlock: "0px",
    insetInlineStart: "1px",
    zIndex: "10",
    display: "flex",
    alignItems: "center",
    paddingInlineStart: "calc(calc(0.25rem * 3) - 1px)",
    opacity: "80%",
  },
  report4: {
    borderColor: "transparent",
    backgroundColor: "transparent",
    boxShadow: "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000",
    "::before": {
      content: '""',
      display: "none",
    },
  },
  report5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  report6: {
    animation: `${pulse} 2s cubic-bezier(.4, 0, .6, 1) infinite`,
  },
})
