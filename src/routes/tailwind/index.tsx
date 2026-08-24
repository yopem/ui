import { createFileRoute } from "@tanstack/react-router"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BarChart3Icon,
  BellIcon,
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CreditCardIcon,
  DownloadIcon,
  FolderIcon,
  HeartIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LoaderCircleIcon,
  MailIcon,
  PackageIcon,
  RocketIcon,
  RouteIcon,
  SearchIcon,
  SettingsIcon,
  Share2Icon,
  ShieldAlertIcon,
  SparklesIcon,
  StarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react"
import * as React from "react"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/tailwind/accordion"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/tailwind/alert"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/tailwind/alert-dialog"
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/components/ui/tailwind/autocomplete"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/tailwind/avatar"
import { Badge } from "@/components/ui/tailwind/badge"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/tailwind/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/tailwind/button"
import { Calendar } from "@/components/ui/tailwind/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardPanel,
} from "@/components/ui/tailwind/card"
import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { CheckboxGroup } from "@/components/ui/tailwind/checkbox-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/tailwind/collapsible"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/tailwind/combobox"
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
} from "@/components/ui/tailwind/command"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/tailwind/context-menu"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/tailwind/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/tailwind/drawer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/tailwind/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/tailwind/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/tailwind/fieldset"
import { Form } from "@/components/ui/tailwind/form"
import { Frame } from "@/components/ui/tailwind/frame"
import { Group } from "@/components/ui/tailwind/group"
import { Input } from "@/components/ui/tailwind/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"
import { Kbd, KbdGroup } from "@/components/ui/tailwind/kbd"
import { Label } from "@/components/ui/tailwind/label"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
  MenuGroupLabel,
  MenuGroup,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
} from "@/components/ui/tailwind/menu"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/tailwind/meter"
import { NumberField } from "@/components/ui/tailwind/number-field"
import { OTPField, OTPFieldInput } from "@/components/ui/tailwind/otp-field"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/tailwind/pagination"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/tailwind/popover"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/tailwind/preview-card"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/tailwind/progress"
import { Radio, RadioGroup } from "@/components/ui/tailwind/radio-group"
import { ScrollArea } from "@/components/ui/tailwind/scroll-area"
import {
  Select,
  SelectButton,
  SelectItem,
  SelectPopup,
  SelectValue,
} from "@/components/ui/tailwind/select"
import { Separator } from "@/components/ui/tailwind/separator"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/tailwind/sheet"
import { Skeleton } from "@/components/ui/tailwind/skeleton"
import { Slider } from "@/components/ui/tailwind/slider"
import { Spinner } from "@/components/ui/tailwind/spinner"
import { Switch } from "@/components/ui/tailwind/switch"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/tailwind/table"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tailwind/tabs"
import { Textarea } from "@/components/ui/tailwind/textarea"
import { ToastProvider, toastManager } from "@/components/ui/tailwind/toast"
import { Toggle } from "@/components/ui/tailwind/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/tailwind/toggle-group"
import { Toolbar } from "@/components/ui/tailwind/toolbar"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tailwind/tooltip"
import appCss from "@/styles.css?url"

export const Route = createFileRoute("/tailwind/")({
  head: () => ({ links: [{ href: appCss, rel: "stylesheet" }] }),
  component: RouteComponent,
})

function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="bg-card scroll-mt-6 rounded-2xl border p-6 shadow-xs/5"
      id={id}
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {desc ? (
        <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}
function DemoCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background overflow-hidden rounded-xl border">
      <div className="text-muted-foreground bg-muted/30 border-b px-3 py-1.5 text-xs font-medium">
        {label}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function CommandPaletteDemo() {
  const [open, setOpen] = React.useState(false)
  const groupedItems = React.useMemo(
    () => [
      {
        items: [
          { label: "Linear", shortcut: "⌘L", value: "linear" },
          { label: "Figma", shortcut: "⌘F", value: "figma" },
          { label: "Slack", shortcut: "⌘S", value: "slack" },
        ],
        value: "Suggestions",
      },
      {
        items: [
          { label: "Clipboard History", shortcut: "⌘⇧C", value: "clipboard" },
          { label: "Import Extension", shortcut: "⌘I", value: "import" },
          { label: "Create Snippet", shortcut: "⌘N", value: "snippet" },
        ],
        value: "Commands",
      },
    ],
    [],
  )
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogTrigger render={<Button variant="outline" />}>
        Open palette
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>J</Kbd>
        </KbdGroup>
      </CommandDialogTrigger>
      <CommandDialogPopup>
        <Command items={groupedItems}>
          <CommandInput placeholder="Search for apps and commands…" />
          <CommandPanel>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList>
              {(
                group: {
                  value: string
                  items: { label: string; shortcut?: string; value: string }[]
                },
                _idx: number,
              ) => (
                <React.Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: {
                        label: string
                        shortcut?: string
                        value: string
                      }) => (
                        <CommandItem
                          key={item.value}
                          value={item.value}
                          onClick={() => setOpen(false)}
                        >
                          <span className="flex-1">{item.label}</span>
                          {item.shortcut ? (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          ) : null}
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </React.Fragment>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>
                  <ArrowUpIcon className="size-3" />
                </Kbd>
                <Kbd>
                  <ArrowDownIcon className="size-3" />
                </Kbd>
              </KbdGroup>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>
                <CornerDownLeftIcon className="size-3" />
              </Kbd>
              <span>Select</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}

const NAV = [
  "accordion",
  "alert",
  "alert-dialog",
  "autocomplete",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "calendar",
  "date-picker",
  "card",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "drawer",
  "empty",
  "field",
  "fieldset",
  "form",
  "frame",
  "group",
  "input",
  "input-group",
  "kbd",
  "label",
  "menu",
  "meter",
  "number-field",
  "otp-field",
  "pagination",
  "popover",
  "preview-card",
  "progress",
  "radio-group",
  "scroll-area",
  "segmented-control",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "slider",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "toolbar",
  "tooltip",
  "sidebar",
]

function RouteComponent() {
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const fruitItems = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Orange", value: "orange" },
    { label: "Grape", value: "grape" },
    { label: "Strawberry", value: "strawberry" },
    { label: "Mango", value: "mango" },
  ]
  return (
    <ToastProvider>
      <div className="bg-background text-foreground min-h-screen">
        <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
            <div>
              <h1 className="text-lg font-semibold">
                Tailwind UI — COSS Complete Preview
              </h1>
              <p className="text-muted-foreground text-xs">
                54 components • segmented real-world examples from
                coss.com/ui/docs • particles adapted
              </p>
            </div>
            <a
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="#accordion"
            >
              Jump
            </a>
          </div>
        </header>
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[210px_1fr]">
          <nav className="hidden h-fit lg:sticky lg:top-16.25 lg:block">
            <div className="bg-card rounded-xl border p-3">
              <div className="mb-2 text-xs font-semibold tracking-widest uppercase opacity-60">
                Components
              </div>
              <div className="flex max-h-[calc(100vh-120px)] flex-col gap-0.5 overflow-auto">
                {NAV.map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="hover:bg-accent rounded-md px-2 py-1 text-sm capitalize"
                  >
                    {id.replaceAll("-", " ")}
                  </a>
                ))}
              </div>
            </div>
          </nav>
          <div className="flex flex-col gap-6">
            <Section
              id="accordion"
              title="Accordion"
              desc="FAQ • Settings grouping • real-world"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Basic / FAQ">
                  <Accordion className="w-full">
                    {[
                      {
                        id: "1",
                        title: "What is COSS?",
                        content:
                          "COSS is Cal.com design system built on Base UI + Tailwind — unstyled primitives with full accessibility.",
                      },
                      {
                        id: "2",
                        title: "Is it accessible?",
                        content:
                          "Yes. All components follow WAI-ARIA, keyboard nav, focus management via Base UI.",
                      },
                      {
                        id: "3",
                        title: "Can I use in my project?",
                        content:
                          "Yes — free and open source, copy-paste components.",
                      },
                    ].map((i) => (
                      <AccordionItem key={i.id} value={i.id}>
                        <AccordionTrigger>{i.title}</AccordionTrigger>
                        <AccordionPanel>{i.content}</AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </DemoCard>
                <DemoCard label="Real-world — Help center (single-open)">
                  <Accordion
                    className="w-full max-w-xl"
                    defaultValue={["billing"]}
                  >
                    <AccordionItem value="billing">
                      <AccordionTrigger>
                        <CreditCardIcon className="size-4" /> Billing & plans
                      </AccordionTrigger>
                      <AccordionPanel>
                        Manage subscriptions, invoices and seats from Settings →
                        Billing. Contact support for custom plans.
                      </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value="security">
                      <AccordionTrigger>
                        <ShieldAlertIcon className="size-4" /> Security
                      </AccordionTrigger>
                      <AccordionPanel>
                        SSO, 2FA and audit logs are available on Pro. Data
                        encrypted at rest with AES-256.
                      </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value="api">
                      <AccordionTrigger>
                        <SettingsIcon className="size-4" /> API
                      </AccordionTrigger>
                      <AccordionPanel>
                        Rate limit 60 req/min per key. Use pagination with
                        cursor param. See /docs/api.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="alert"
              title="Alert"
              desc="info • success • warning • error • with actions"
            >
              <div className="grid gap-3">
                <DemoCard label="Real-world — App notices">
                  <div className="grid gap-3">
                    <Alert variant="info">
                      <CircleAlertIcon />
                      <AlertTitle>Scheduled maintenance</AlertTitle>
                      <AlertDescription>
                        API will be unavailable Sunday 02:00–04:00 UTC. Upgrade
                        cal.com/coss.
                      </AlertDescription>
                    </Alert>
                    <Alert variant="success">
                      <CheckIcon />
                      <AlertTitle>Deployment succeeded</AlertTitle>
                      <AlertDescription>
                        Version 2.14.0 is live. View changelog.
                      </AlertDescription>
                      <AlertAction>
                        <Button size="xs" variant="outline">
                          Changelog
                        </Button>
                      </AlertAction>
                    </Alert>
                    <Alert variant="warning">
                      <AlertTriangleIcon />
                      <AlertTitle>Trial ends in 3 days</AlertTitle>
                      <AlertDescription>
                        Upgrade to keep SSO and audit logs.
                      </AlertDescription>
                      <AlertAction>
                        <Button size="xs">Upgrade</Button>
                      </AlertAction>
                    </Alert>
                    <Alert variant="error">
                      <AlertCircleIcon />
                      <AlertTitle>Payment failed</AlertTitle>
                      <AlertDescription>
                        Card ending 4242 declined. Update payment method.
                      </AlertDescription>
                      <AlertAction>
                        <Button size="xs" variant="outline">
                          Update
                        </Button>
                      </AlertAction>
                    </Alert>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="alert-dialog"
              title="AlertDialog"
              desc="destructive confirmation"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Delete project — destructive">
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={buttonVariants({
                        variant: "destructive",
                        size: "sm",
                      })}
                    >
                      Delete project
                    </AlertDialogTrigger>
                    <AlertDialogPopup>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete “Website Redesign”?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes project, tasks and files. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 flex justify-end gap-2">
                        <AlertDialogClose
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Cancel
                        </AlertDialogClose>
                        <Button size="sm" variant="destructive">
                          <TrashIcon /> Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogPopup>
                  </AlertDialog>
                </DemoCard>
                <DemoCard label="Leave team">
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Leave team
                    </AlertDialogTrigger>
                    <AlertDialogPopup>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Leave “Design Team”?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You will lose access to shared boards. Re-invite
                          required to rejoin.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 flex justify-end gap-2">
                        <AlertDialogClose
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Cancel
                        </AlertDialogClose>
                        <Button size="sm">Leave</Button>
                      </AlertDialogFooter>
                    </AlertDialogPopup>
                  </AlertDialog>
                </DemoCard>
              </div>
            </Section>

            <Section id="autocomplete" title="Autocomplete">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Fruit search — filter">
                  <Autocomplete items={fruitItems}>
                    <AutocompleteInput
                      aria-label="Search fruit"
                      placeholder="Search fruit…"
                    />
                    <AutocompletePopup>
                      <AutocompleteEmpty>No fruit found.</AutocompleteEmpty>
                      <AutocompleteList>
                        {(item: { label: string; value: string }) => (
                          <AutocompleteItem key={item.value} value={item}>
                            {item.label}
                          </AutocompleteItem>
                        )}
                      </AutocompleteList>
                    </AutocompletePopup>
                  </Autocomplete>
                </DemoCard>
                <DemoCard label="Command-like — pluggable">
                  <Autocomplete items={fruitItems}>
                    <AutocompleteInput
                      aria-label="Pick"
                      placeholder="Type to filter…"
                    />
                    <AutocompletePopup className="max-h-40">
                      <AutocompleteList>
                        {(item: { label: string; value: string }) => (
                          <AutocompleteItem key={item.value} value={item}>
                            <SearchIcon className="size-4 opacity-60" />{" "}
                            {item.label}
                          </AutocompleteItem>
                        )}
                      </AutocompleteList>
                    </AutocompletePopup>
                  </Autocomplete>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="avatar"
              title="Avatar"
              desc="image • fallback • sizes • group • status"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Variants">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        alt="avatar"
                        src="https://i.pravatar.cc/100?img=12"
                      />
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>CD</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-12">
                      <AvatarFallback>LG</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-6">
                      <AvatarFallback className="text-xs">SM</AvatarFallback>
                    </Avatar>
                  </div>
                </DemoCard>
                <DemoCard label="Real-world — Assignees stack">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <Avatar
                          key={i}
                          className="border-background size-8 border-2"
                        >
                          <AvatarImage
                            alt="u"
                            src={"https://i.pravatar.cc/100?img=" + (10 + i)}
                          />
                          <AvatarFallback>U{i}</AvatarFallback>
                        </Avatar>
                      ))}
                      <span className="bg-muted border-background flex size-8 items-center justify-center rounded-full border-2 text-xs">
                        +4
                      </span>
                    </div>
                    <span className="text-muted-foreground ml-3 text-sm">
                      7 assignees
                    </span>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="badge" title="Badge" desc="status • real-world">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Variants">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "default",
                        "secondary",
                        "outline",
                        "success",
                        "warning",
                        "error",
                        "info",
                      ] as const
                    ).map((v) => (
                      <Badge key={v} variant={v}>
                        {v}
                      </Badge>
                    ))}
                  </div>
                </DemoCard>
                <DemoCard label="Real-world — Ticket labels">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">
                      <PackageIcon className="size-3" /> Feature
                    </Badge>
                    <Badge variant="warning">In review</Badge>
                    <Badge variant="success">
                      <CheckIcon className="size-3" /> Done
                    </Badge>
                    <Badge variant="error">Blocked</Badge>
                    <Badge variant="outline">v2.4.0</Badge>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="breadcrumb" title="Breadcrumb">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Basic">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="#">Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator>
                        <ChevronRightIcon className="size-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="#">Projects</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Website Redesign</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </DemoCard>
                <DemoCard label="Real-world — Docs path + ellipsis">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="#">Docs</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbEllipsis />
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="#">Components</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="button"
              title="Button"
              desc="variants • sizes • states • real-world CTA bar"
            >
              <div className="grid gap-4">
                <DemoCard label="Variants">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "default",
                        "destructive",
                        "destructive-outline",
                        "ghost",
                        "link",
                        "outline",
                        "secondary",
                      ] as const
                    ).map((v) => (
                      <Button key={v} variant={v}>
                        {v}
                      </Button>
                    ))}
                  </div>
                </DemoCard>
                <DemoCard label="Real-world — Editor toolbar actions + loading">
                  <div className="flex flex-wrap gap-2">
                    <Button>
                      <SparklesIcon /> Generate
                    </Button>
                    <Button variant="outline">
                      <DownloadIcon /> Export
                    </Button>
                    <Button variant="ghost">
                      <Share2Icon /> Share
                    </Button>
                    <Button disabled>Disabled</Button>
                    <Button loading>Publishing…</Button>
                    <Button size="icon" variant="outline" aria-label="fav">
                      <HeartIcon />
                    </Button>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="calendar" title="Calendar">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Single pick">
                  <Calendar
                    mode="single"
                    defaultMonth={new Date()}
                    className="max-w-fit rounded-lg border p-3 shadow-xs/5"
                    captionLayout="dropdown"
                  />
                </DemoCard>
                <DemoCard label="Real-world — Booking preview">
                  <Calendar
                    mode="single"
                    defaultMonth={new Date()}
                    className="max-w-fit rounded-lg border p-3"
                  />
                </DemoCard>
              </div>
            </Section>

            <Section
              id="date-picker"
              title="Date Picker"
              desc="Popover + Calendar composition (from docs)"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Pick a date (single)">
                  <Popover>
                    <PopoverTrigger
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <CalendarIcon />{" "}
                      {date ? date.toLocaleDateString() : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverPopup className="p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        defaultMonth={date}
                      />
                    </PopoverPopup>
                  </Popover>
                  {date ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Selected: {date.toDateString()}
                    </p>
                  ) : null}
                </DemoCard>
                <DemoCard label="Real-world — Trip dates">
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <CalendarIcon /> Check in
                      </PopoverTrigger>
                      <PopoverPopup className="p-0">
                        <Calendar
                          mode="single"
                          onSelect={setDate}
                          selected={date}
                        />
                      </PopoverPopup>
                    </Popover>
                    <Popover>
                      <PopoverTrigger
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <CalendarIcon /> Check out
                      </PopoverTrigger>
                      <PopoverPopup className="p-0">
                        <Calendar mode="single" />
                      </PopoverPopup>
                    </Popover>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Composed from Popover + Calendar — same as coss date-picker
                    docs.
                  </p>
                </DemoCard>
              </div>
            </Section>

            <Section id="card" title="Card" desc="real-world layouts">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Create project (form inside card)">
                  <Card className="w-full max-w-xs">
                    <CardHeader>
                      <CardTitle>Create project</CardTitle>
                      <CardDescription>
                        Deploy your new project.
                      </CardDescription>
                    </CardHeader>
                    <CardPanel className="flex flex-col gap-3">
                      <Field>
                        <FieldLabel>Project name</FieldLabel>
                        <Input placeholder="my-app" />
                      </Field>
                      <Field>
                        <FieldLabel>Framework</FieldLabel>
                        <Select defaultValue="next">
                          <SelectButton>
                            <SelectValue />
                          </SelectButton>
                          <SelectPopup>
                            <SelectItem>next</SelectItem>
                            <SelectItem>vite</SelectItem>
                            <SelectItem>astro</SelectItem>
                          </SelectPopup>
                        </Select>
                      </Field>
                    </CardPanel>
                    <CardFooter className="justify-between">
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                      <Button size="sm">Deploy</Button>
                    </CardFooter>
                  </Card>
                </DemoCard>
                <DemoCard label="Login">
                  <Card className="w-full max-w-xs">
                    <CardHeader className="border-b">
                      <CardTitle>Login to account</CardTitle>
                      <CardDescription>
                        Enter email and password
                      </CardDescription>
                    </CardHeader>
                    <CardPanel className="flex flex-col gap-3">
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input placeholder="you@example.com" type="email" />
                      </Field>
                      <Field>
                        <FieldLabel>Password</FieldLabel>
                        <Input placeholder="••••••••" type="password" />
                      </Field>
                    </CardPanel>
                    <CardFooter>
                      <Button className="w-full">Sign in</Button>
                    </CardFooter>
                  </Card>
                </DemoCard>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardDescription>Revenue</CardDescription>
                    <CardTitle>$24,580</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-xs">
                    +12% vs last month
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Active users</CardDescription>
                    <CardTitle>1,284</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-xs">
                    304 currently online
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Open tasks</CardDescription>
                    <CardTitle>32</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress max={100} value={64}>
                      <ProgressTrack>
                        <ProgressIndicator style={{ width: "64%" }} />
                      </ProgressTrack>
                    </Progress>
                  </CardContent>
                </Card>
              </div>
            </Section>

            <Section id="checkbox" title="Checkbox / CheckboxGroup">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="States">
                  <div className="flex flex-wrap items-center gap-4">
                    <Label className="gap-2">
                      <Checkbox defaultChecked /> Checked
                    </Label>
                    <Label className="gap-2">
                      <Checkbox /> Unchecked
                    </Label>
                    <Label className="gap-2">
                      <Checkbox indeterminate /> Indeterminate
                    </Label>
                  </div>
                </DemoCard>
                <DemoCard label="Real-world — Task list">
                  <CheckboxGroup defaultValue={["notif"]}>
                    <Label className="gap-2">
                      <Checkbox value="notif" /> Email notifications
                    </Label>
                    <Label className="gap-2">
                      <Checkbox value="marketing" /> Marketing emails
                    </Label>
                    <Label className="gap-2">
                      <Checkbox value="security" /> Security alerts
                    </Label>
                  </CheckboxGroup>
                </DemoCard>
              </div>
            </Section>

            <Section id="collapsible" title="Collapsible">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Basic">
                  <Collapsible
                    defaultOpen
                    className="max-w-xl rounded-lg border p-3"
                  >
                    <CollapsibleTrigger className="text-sm font-medium">
                      Toggle details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-muted-foreground mt-2 text-sm">
                      Collapsible content — shipping address, billing info, etc.
                    </CollapsibleContent>
                  </Collapsible>
                </DemoCard>
                <DemoCard label="Real-world — Show more">
                  <Collapsible className="max-w-xl rounded-lg border p-3">
                    <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
                      Details <ChevronDownIcon className="size-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-muted-foreground mt-2 text-sm leading-6">
                      Estimated delivery: 3–5 days. Free returns within 30 days.
                      Need help? Contact support.
                    </CollapsibleContent>
                  </Collapsible>
                </DemoCard>
              </div>
            </Section>

            <Section id="combobox" title="Combobox">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Single select">
                  <Combobox items={fruitItems}>
                    <ComboboxInput
                      aria-label="Select fruit"
                      placeholder="Select fruit…"
                    />
                    <ComboboxPopup>
                      <ComboboxEmpty>No fruit.</ComboboxEmpty>
                      <ComboboxList>
                        {(item: { label: string; value: string }) => (
                          <ComboboxItem key={item.value} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxPopup>
                  </Combobox>
                </DemoCard>
                <DemoCard label="Real-world — Assign to project">
                  <Combobox
                    items={[
                      { label: "Website Redesign", value: "wr" },
                      { label: "Mobile App", value: "ma" },
                      { label: "Brand Kit", value: "bk" },
                    ]}
                  >
                    <ComboboxInput
                      aria-label="Project"
                      placeholder="Search projects…"
                    />
                    <ComboboxPopup>
                      <ComboboxEmpty>No project</ComboboxEmpty>
                      <ComboboxList>
                        {(item: { label: string; value: string }) => (
                          <ComboboxItem key={item.value} value={item}>
                            <PackageIcon className="size-4 opacity-60" />{" "}
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxPopup>
                  </Combobox>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="command"
              title="Command"
              desc="palette • search • from coss docs (p-command-1)"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Palette — ⌘J trigger">
                  <CommandPaletteDemo />
                </DemoCard>
                <DemoCard label="Inline — always open (preview)">
                  <div className="bg-popover rounded-xl border">
                    <Command
                      items={[
                        {
                          items: [
                            { label: "Dashboard", value: "dashboard" },
                            { label: "Projects", value: "projects" },
                          ],
                          value: "Pages",
                        },
                      ]}
                    >
                      <CommandInput placeholder="Search…" />
                      <CommandPanel>
                        <CommandList>
                          {(group: {
                            value: string
                            items: { label: string; value: string }[]
                          }) => (
                            <React.Fragment key={group.value}>
                              <CommandGroup items={group.items}>
                                <CommandGroupLabel>
                                  {group.value}
                                </CommandGroupLabel>
                                <CommandCollection>
                                  {(item: { label: string; value: string }) => (
                                    <CommandItem
                                      key={item.value}
                                      value={item.value}
                                    >
                                      {item.label}
                                    </CommandItem>
                                  )}
                                </CommandCollection>
                              </CommandGroup>
                            </React.Fragment>
                          )}
                        </CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                      </CommandPanel>
                    </Command>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="context-menu" title="ContextMenu">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Right-click area">
                  <ContextMenu>
                    <ContextMenuTrigger className="text-muted-foreground flex h-28 w-full items-center justify-center rounded-lg border border-dashed text-sm">
                      Right click here
                    </ContextMenuTrigger>
                    <ContextMenuPopup>
                      <ContextMenuItem>
                        <ArrowRightIcon className="size-4" /> Open
                      </ContextMenuItem>
                      <ContextMenuItem>Duplicate</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive">
                        Delete
                      </ContextMenuItem>
                    </ContextMenuPopup>
                  </ContextMenu>
                </DemoCard>
                <DemoCard label="Real-world — File row">
                  <ContextMenu>
                    <ContextMenuTrigger className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="flex items-center gap-2">
                        <FolderIcon className="size-4" /> proposal.pdf
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Right-click for actions
                      </span>
                    </ContextMenuTrigger>
                    <ContextMenuPopup>
                      <ContextMenuItem>Rename</ContextMenuItem>
                      <ContextMenuItem>Move to…</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem>
                        <DownloadIcon className="size-4" /> Download
                      </ContextMenuItem>
                    </ContextMenuPopup>
                  </ContextMenu>
                </DemoCard>
              </div>
            </Section>

            <Section id="dialog" title="Dialog / Drawer / Sheet / AlertDialog">
              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    Edit profile
                  </DialogTrigger>
                  <DialogPopup className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                      <DialogDescription>
                        Make changes and save.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogPanel className="flex flex-col gap-3">
                      <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input placeholder="Ada Lovelace" />
                      </Field>
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input placeholder="ada@example.com" />
                      </Field>
                    </DialogPanel>
                    <DialogFooter>
                      <DialogClose
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Cancel
                      </DialogClose>
                      <Button size="sm">Save</Button>
                    </DialogFooter>
                  </DialogPopup>
                </Dialog>
                <Drawer>
                  <DrawerTrigger
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    Drawer
                  </DrawerTrigger>
                  <DrawerPopup showBar>
                    <DrawerHeader className="text-center">
                      <DrawerTitle>Cart</DrawerTitle>
                      <DrawerDescription>2 items • $84.00</DrawerDescription>
                    </DrawerHeader>
                    <div className="space-y-2 p-4 text-sm">
                      <div className="flex justify-between rounded-md border p-2">
                        <span>Plan Pro (monthly)</span>
                        <span>$49</span>
                      </div>
                      <div className="flex justify-between rounded-md border p-2">
                        <span>Seats × 2</span>
                        <span>$35</span>
                      </div>
                    </div>
                    <DrawerFooter variant="bare" className="justify-center">
                      <DrawerClose
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        Close
                      </DrawerClose>
                      <Button size="sm">Checkout</Button>
                    </DrawerFooter>
                  </DrawerPopup>
                </Drawer>
                <Sheet>
                  <SheetTrigger
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    Sheet
                  </SheetTrigger>
                  <SheetPopup>
                    <SheetHeader>
                      <SheetTitle>Settings</SheetTitle>
                      <SheetDescription>Manage preferences</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 p-4 text-sm">
                      <Label className="gap-2">
                        <Switch defaultChecked /> Email notifications
                      </Label>
                      <Label className="gap-2">
                        <Switch /> Marketing emails
                      </Label>
                    </div>
                    <SheetFooter>
                      <SheetClose
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        Close
                      </SheetClose>
                    </SheetFooter>
                  </SheetPopup>
                </Sheet>
              </div>
            </Section>

            <Section id="empty" title="Empty" desc="real-world placeholders">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="No meetings">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <RouteIcon />
                      </EmptyMedia>
                      <EmptyTitle>No upcoming meetings</EmptyTitle>
                      <EmptyDescription>
                        Create a meeting to get started.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <div className="flex justify-center gap-2">
                        <Button size="sm">Create meeting</Button>
                        <Button size="sm" variant="outline">
                          <BookIcon />
                          Docs
                        </Button>
                      </div>
                    </EmptyContent>
                  </Empty>
                </DemoCard>
                <DemoCard label="No orders">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <InboxIcon />
                      </EmptyMedia>
                      <EmptyTitle>No orders yet</EmptyTitle>
                      <EmptyDescription>
                        Orders will appear after checkout.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button size="sm" variant="outline">
                        <PackageIcon /> Browse products
                      </Button>
                    </EmptyContent>
                  </Empty>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="form"
              title="Form / Field / Fieldset"
              desc="validation • real-world"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Sign up">
                  <Form className="flex flex-col gap-3">
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input placeholder="you@example.com" />
                      <FieldDescription>
                        We will not share your email.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel>Password</FieldLabel>
                      <Input placeholder="••••••••" type="password" />
                    </Field>
                    <Button type="submit" size="sm">
                      Create account
                    </Button>
                  </Form>
                </DemoCard>
                <DemoCard label="With error + fieldset">
                  <Fieldset>
                    <FieldsetLegend>Shipping address</FieldsetLegend>
                    <div className="mt-3 flex flex-col gap-3">
                      <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input placeholder="Ada" />
                      </Field>
                      <Field>
                        <FieldLabel>Address</FieldLabel>
                        <Input aria-invalid placeholder="Required" />
                        <FieldError>Address is required</FieldError>
                      </Field>
                    </div>
                  </Fieldset>
                </DemoCard>
              </div>
            </Section>

            <Section id="group" title="Group" desc="real-world: joined actions">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Horizontal — Filter bar">
                  <Group orientation="horizontal">
                    <Button variant="outline" size="sm">
                      All
                    </Button>
                    <Button variant="outline" size="sm">
                      Active
                    </Button>
                    <Button variant="outline" size="sm">
                      Archived
                    </Button>
                  </Group>
                </DemoCard>
                <DemoCard label="Vertical — Share segment">
                  <Group orientation="vertical" className="w-fit">
                    <Button variant="outline" size="sm">
                      <Share2Icon /> Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <MailIcon /> Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <BellIcon /> Invite
                    </Button>
                  </Group>
                </DemoCard>
              </div>
            </Section>

            <Section id="input" title="Input / NumberField / OTPField">
              <div className="grid gap-4">
                <DemoCard label="Real-world — Checkout">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Card number" />
                    <Input placeholder="MM / YY" />
                    <Input placeholder="CVC" />
                    <NumberField defaultValue={1} min={1} max={10} />
                    <div className="flex gap-2 sm:col-span-2">
                      <OTPField length={6}>
                        <OTPFieldInput />
                        <OTPFieldInput />
                        <OTPFieldInput />
                        <OTPFieldInput />
                        <OTPFieldInput />
                        <OTPFieldInput />
                      </OTPField>
                      <span className="text-muted-foreground self-center text-xs">
                        Verify code
                      </span>
                    </div>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="input-group" title="InputGroup">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Search + kbd">
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <SearchIcon className="size-4 opacity-60" />
                    </InputGroupAddon>
                    <InputGroupInput placeholder="Search docs…" />
                    <InputGroupAddon align="inline-end">
                      <Kbd>⌘K</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                </DemoCard>
                <DemoCard label="Subscribe">
                  <InputGroup>
                    <InputGroupInput placeholder="you@example.com" />
                    <InputGroupAddon align="inline-end">
                      <Button size="xs">Subscribe</Button>
                    </InputGroupAddon>
                  </InputGroup>
                </DemoCard>
              </div>
            </Section>

            <Section id="kbd" title="Kbd">
              <DemoCard label="Shortcuts">
                <div className="flex flex-wrap items-center gap-2">
                  <Kbd>⌘</Kbd> <Kbd>K</Kbd>
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>⇧</Kbd>
                    <Kbd>P</Kbd>
                  </KbdGroup>
                  <span className="text-muted-foreground text-sm">+</span>{" "}
                  <Kbd>Ctrl</Kbd>{" "}
                  <span className="text-muted-foreground text-sm">+</span>{" "}
                  <Kbd>C</Kbd>
                </div>
              </DemoCard>
            </Section>

            <Section id="menu" title="Menu">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Actions">
                  <Menu>
                    <MenuTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Open menu
                    </MenuTrigger>
                    <MenuPopup>
                      <MenuGroup>
                        <MenuGroupLabel>Actions</MenuGroupLabel>
                        <MenuItem>
                          <RocketIcon className="size-4" /> New project{" "}
                          <MenuShortcut>⌘N</MenuShortcut>
                        </MenuItem>
                        <MenuItem>Duplicate</MenuItem>
                        <MenuSeparator />
                        <MenuItem className="text-destructive">
                          <TrashIcon className="size-4" /> Delete
                        </MenuItem>
                      </MenuGroup>
                    </MenuPopup>
                  </Menu>
                </DemoCard>
                <DemoCard label="With submenu">
                  <Menu>
                    <MenuTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Export
                    </MenuTrigger>
                    <MenuPopup>
                      <MenuItem>
                        <DownloadIcon className="size-4" /> Export as PDF
                      </MenuItem>
                      <MenuSub>
                        <MenuSubTrigger>
                          More formats{" "}
                          <ChevronRightIcon className="ml-auto size-4" />
                        </MenuSubTrigger>
                        <MenuSubPopup>
                          <MenuItem>PNG</MenuItem>
                          <MenuItem>SVG</MenuItem>
                        </MenuSubPopup>
                      </MenuSub>
                    </MenuPopup>
                  </Menu>
                </DemoCard>
              </div>
            </Section>

            <Section id="meter" title="Meter">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Storage — real-world">
                  <Meter max={100} value={72}>
                    <div className="flex justify-between text-sm">
                      <MeterLabel>Storage</MeterLabel>
                      <MeterValue />
                    </div>
                    <MeterTrack>
                      <MeterIndicator style={{ width: "72%" }} />
                    </MeterTrack>
                  </Meter>
                </DemoCard>
                <DemoCard label="Download">
                  <Meter max={100} value={45}>
                    <div className="flex justify-between text-sm">
                      <MeterLabel>Download</MeterLabel>
                      <MeterValue />
                    </div>
                    <MeterTrack>
                      <MeterIndicator style={{ width: "45%" }} />
                    </MeterTrack>
                  </Meter>
                </DemoCard>
              </div>
            </Section>

            <Section id="number-field" title="NumberField">
              <DemoCard label="Quantity — ecommerce">
                <div className="flex items-center gap-4">
                  <NumberField defaultValue={2} min={0} max={10} />
                  <span className="text-muted-foreground text-sm">
                    × $29 = $58
                  </span>
                </div>
              </DemoCard>
            </Section>

            <Section id="otp-field" title="OTPField">
              <DemoCard label="Verify email">
                <div className="flex flex-col gap-3">
                  <p className="text-sm">Code sent to ada@example.com</p>
                  <OTPField length={6}>
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldInput />
                  </OTPField>
                </div>
              </DemoCard>
            </Section>

            <Section id="pagination" title="Pagination">
              <DemoCard label="Table footer">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationLink href="#">‹ Prev</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">10</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">Next ›</PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </DemoCard>
            </Section>

            <Section id="popover" title="Popover / Tooltip / PreviewCard">
              <div className="flex flex-wrap gap-4">
                <DemoCard label="Help popover">
                  <Popover>
                    <PopoverTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      What is this?
                    </PopoverTrigger>
                    <PopoverPopup className="bg-popover max-w-xs rounded-lg border p-3 text-sm shadow-md">
                      Popovers show extra info without navigating. Click outside
                      to close.
                    </PopoverPopup>
                  </Popover>
                </DemoCard>
                <DemoCard label="Tooltip">
                  <Tooltip>
                    <TooltipTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Hover me
                    </TooltipTrigger>
                    <TooltipPopup>Tooltip — helpful hint</TooltipPopup>
                  </Tooltip>
                </DemoCard>
                <DemoCard label="Link preview">
                  <PreviewCard>
                    <PreviewCardTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      cal.com
                    </PreviewCardTrigger>
                    <PreviewCardPopup className="bg-popover rounded-lg border p-3 text-sm">
                      Cal.com — open scheduling infrastructure. PreviewCard
                      shows on hover with delay.
                    </PreviewCardPopup>
                  </PreviewCard>
                </DemoCard>
              </div>
            </Section>

            <Section id="progress" title="Progress / Meter">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Upload">
                  <Progress max={100} value={68}>
                    <div className="flex justify-between text-sm">
                      <ProgressLabel>Uploading…</ProgressLabel>
                      <ProgressValue />
                    </div>
                    <ProgressTrack>
                      <ProgressIndicator style={{ width: "68%" }} />
                    </ProgressTrack>
                  </Progress>
                </DemoCard>
                <DemoCard label="Onboarding">
                  <Progress max={4} value={2}>
                    <div className="flex justify-between text-sm">
                      <ProgressLabel>Step 2 of 4</ProgressLabel>
                      <ProgressValue />
                    </div>
                    <ProgressTrack>
                      <ProgressIndicator style={{ width: "50%" }} />
                    </ProgressTrack>
                  </Progress>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="radio-group"
              title="RadioGroup"
              desc="real-world selector"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Plan">
                  <RadioGroup defaultValue="pro">
                    <Label className="gap-2 rounded-lg border p-3">
                      <Radio value="free" /> Free{" "}
                      <span className="text-muted-foreground ml-auto text-xs">
                        $0
                      </span>
                    </Label>
                    <Label className="bg-accent gap-2 rounded-lg border p-3">
                      <Radio value="pro" /> Pro{" "}
                      <span className="ml-auto text-xs">$19/mo</span>
                    </Label>
                    <Label className="gap-2 rounded-lg border p-3">
                      <Radio value="team" /> Team{" "}
                      <span className="text-muted-foreground ml-auto text-xs">
                        $39/mo
                      </span>
                    </Label>
                  </RadioGroup>
                </DemoCard>
                <DemoCard label="Delivery">
                  <RadioGroup defaultValue="standard">
                    <Label className="gap-2">
                      <Radio value="standard" /> Standard (3–5d) — Free
                    </Label>
                    <Label className="gap-2">
                      <Radio value="express" /> Express (1–2d) — $12
                    </Label>
                    <Label className="gap-2 opacity-60">
                      <Radio disabled value="pickup" /> Pickup — Unavailable
                    </Label>
                  </RadioGroup>
                </DemoCard>
              </div>
            </Section>

            <Section id="scroll-area" title="ScrollArea / Frame">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Chat scroll">
                  <ScrollArea className="h-36 rounded-lg border">
                    <div className="space-y-2 p-3 text-sm">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div
                          key={i}
                          className="bg-muted/40 rounded-md px-2 py-1"
                        >
                          Message {i + 1}: Hey there — shipped fix for calendar
                          scroll.
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DemoCard>
                <DemoCard label="Frame">
                  <Frame className="rounded-lg border p-4 text-sm">
                    Frame — generic container. Use for diagrams, embeds, code
                    blocks, or framed media.
                  </Frame>
                </DemoCard>
              </div>
            </Section>

            <Section id="select" title="Select" desc="real-world forms">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Framework">
                  <Select defaultValue="apple">
                    <SelectButton style={{ width: 180 }}>
                      <SelectValue />
                    </SelectButton>
                    <SelectPopup>
                      <SelectItem>apple</SelectItem>
                      <SelectItem>banana</SelectItem>
                      <SelectItem>orange</SelectItem>
                    </SelectPopup>
                  </Select>
                </DemoCard>
                <DemoCard label="Sizes + placeholder">
                  <div className="flex gap-2">
                    <Select>
                      <SelectButton size="sm" style={{ width: 140 }}>
                        <SelectValue placeholder="Pick" />
                      </SelectButton>
                      <SelectPopup>
                        <SelectItem>one</SelectItem>
                        <SelectItem>two</SelectItem>
                      </SelectPopup>
                    </Select>
                    <Select defaultValue="banana">
                      <SelectButton size="lg" style={{ width: 140 }}>
                        <SelectValue />
                      </SelectButton>
                      <SelectPopup>
                        <SelectItem>apple</SelectItem>
                        <SelectItem>banana</SelectItem>
                      </SelectPopup>
                    </Select>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="separator" title="Separator">
              <DemoCard label="Horizontal + vertical">
                <div className="flex flex-col gap-3">
                  <div className="text-sm">Section above</div>
                  <Separator />
                  <div className="text-sm">Section below</div>
                  <div className="flex h-8 items-center gap-3">
                    <span className="text-sm">Left</span>
                    <Separator orientation="vertical" />
                    <span className="text-sm">Right</span>
                  </div>
                </div>
              </DemoCard>
            </Section>

            <Section
              id="skeleton"
              title="Skeleton / Spinner"
              desc="loading states"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Article loading">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </DemoCard>
                <DemoCard label="Spinners">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <Spinner className="size-6" />
                    <span className="inline-flex items-center gap-2 text-sm">
                      <LoaderCircleIcon className="size-4 animate-spin" />{" "}
                      Loading…
                    </span>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="slider" title="Slider">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Volume">
                  <Slider defaultValue={[42]} />
                  <p className="text-muted-foreground mt-2 text-xs">
                    Volume control — drag to adjust
                  </p>
                </DemoCard>
                <DemoCard label="Price range">
                  <Slider defaultValue={[20, 80]} />
                  <div className="mt-1 flex justify-between text-xs">
                    <span>$20</span>
                    <span>$80</span>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="switch" title="Switch">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Settings toggles">
                  <div className="flex flex-col gap-3">
                    <Label className="justify-between">
                      <span className="flex items-center gap-2">
                        <BellIcon className="size-4" /> Notifications
                      </span>
                      <Switch defaultChecked />
                    </Label>
                    <Separator />
                    <Label className="justify-between opacity-60">
                      <span>Airplane mode</span>
                      <Switch disabled />
                    </Label>
                  </div>
                </DemoCard>
                <DemoCard label="States">
                  <div className="flex gap-4">
                    <Label className="gap-2">
                      <Switch /> Off
                    </Label>
                    <Label className="gap-2">
                      <Switch defaultChecked /> On
                    </Label>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="table" title="Table" desc="real-world invoices + team">
              <div className="grid gap-6">
                <DemoCard label="Invoices">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">INV001</TableCell>
                        <TableCell>
                          <Badge size="sm" variant="success">
                            Paid
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">$250.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV002</TableCell>
                        <TableCell>
                          <Badge size="sm" variant="warning">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">$150.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV003</TableCell>
                        <TableCell>
                          <Badge size="sm" variant="error">
                            Overdue
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">$350.00</TableCell>
                      </TableRow>
                    </TableBody>
                    <TableCaption>Recent invoices</TableCaption>
                  </Table>
                </DemoCard>
                <DemoCard label="Team — card variant">
                  <Table variant="card">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="text-xs">
                              AL
                            </AvatarFallback>
                          </Avatar>{" "}
                          Ada
                        </TableCell>
                        <TableCell>Engineer</TableCell>
                        <TableCell>
                          <Badge size="sm" variant="outline">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="text-xs">
                              BO
                            </AvatarFallback>
                          </Avatar>{" "}
                          Bob
                        </TableCell>
                        <TableCell>Designer</TableCell>
                        <TableCell>
                          <Badge size="sm" variant="secondary">
                            Away
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="tabs"
              title="Tabs"
              desc="segmented-control style via variant"
            >
              <div className="grid gap-4">
                <DemoCard label="Account settings (default)">
                  <Tabs defaultValue="account">
                    <TabsList>
                      <TabsTab value="account">Account</TabsTab>
                      <TabsTab value="password">Password</TabsTab>
                      <TabsTab value="billing">Billing</TabsTab>
                    </TabsList>
                    <TabsPanel value="account">
                      <div className="rounded-lg border p-4 text-sm">
                        Account: name, email, avatar.
                      </div>
                    </TabsPanel>
                    <TabsPanel value="password">
                      <div className="rounded-lg border p-4 text-sm">
                        Password: change password form.
                      </div>
                    </TabsPanel>
                  </Tabs>
                </DemoCard>
                <DemoCard label="Underline — docs nav">
                  <Tabs defaultValue="code">
                    <TabsList variant="underline">
                      <TabsTab value="code">Code</TabsTab>
                      <TabsTab value="preview">Preview</TabsTab>
                      <TabsTab value="props">Props</TabsTab>
                    </TabsList>
                    <TabsPanel value="code">
                      <div className="bg-muted/30 rounded-md p-3 font-mono text-sm">
                        {"<Button>Click</Button>"}
                      </div>
                    </TabsPanel>
                  </Tabs>
                </DemoCard>
              </div>
            </Section>

            <Section id="textarea" title="Textarea">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Comment">
                  <Textarea placeholder="Write a comment…" rows={3} />
                </DemoCard>
                <DemoCard label="Real-world — Feedback + char count">
                  <div className="grid gap-2">
                    <Textarea
                      placeholder="Tell us what you think…"
                      rows={3}
                      defaultValue="Great product! Would love dark mode tweaks."
                    />
                    <span className="text-muted-foreground text-right text-xs">
                      48 / 500
                    </span>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section id="toast" title="Toast">
              <DemoCard label="Actions">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toastManager.add({
                        title: "Event created",
                        description: "Monday, Jan 3 at 6:00pm",
                      })
                    }
                  >
                    Default
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toastManager.add({ title: "Saved", type: "success" })
                    }
                  >
                    Success
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toastManager.add({
                        title: "Failed to save",
                        type: "error",
                      })
                    }
                  >
                    Error
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toastManager.add({
                        title: "Info",
                        description: "New version available",
                        type: "info",
                      })
                    }
                  >
                    Info
                  </Button>
                </div>
              </DemoCard>
            </Section>

            <Section id="toggle" title="Toggle">
              <DemoCard label="Formatting">
                <div className="flex flex-wrap gap-2">
                  <Toggle variant="outline">
                    <StarIcon /> Bookmark
                  </Toggle>
                  <Toggle pressed variant="outline">
                    <StarIcon className="fill-current" /> Bookmarked
                  </Toggle>
                  <Toggle size="sm" variant="outline">
                    sm
                  </Toggle>
                  <Toggle size="lg" variant="outline">
                    lg
                  </Toggle>
                </div>
              </DemoCard>
            </Section>

            <Section id="toggle-group" title="ToggleGroup">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Multiple — formatting">
                  <ToggleGroup defaultValue={["bold"]}>
                    <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
                    <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
                    <ToggleGroupItem value="underline">
                      Underline
                    </ToggleGroupItem>
                  </ToggleGroup>
                </DemoCard>
                <DemoCard label="Single — align">
                  <ToggleGroup defaultValue={["center"]}>
                    <ToggleGroupItem value="left">Left</ToggleGroupItem>
                    <ToggleGroupItem value="center">Center</ToggleGroupItem>
                    <ToggleGroupItem value="right">Right</ToggleGroupItem>
                  </ToggleGroup>
                </DemoCard>
              </div>
            </Section>

            <Section id="toolbar" title="Toolbar">
              <DemoCard label="Editor">
                <Toolbar className="flex w-fit items-center gap-1 rounded-lg border p-1">
                  <Button aria-label="bold" size="icon-sm" variant="ghost">
                    <StarIcon className="size-4" />
                  </Button>
                  <Separator className="mx-1 h-6" orientation="vertical" />
                  <Button size="sm" variant="ghost">
                    <SettingsIcon className="size-4" /> Settings
                  </Button>
                  <Button size="sm" variant="ghost">
                    <TrashIcon className="size-4" /> Delete
                  </Button>
                </Toolbar>
              </DemoCard>
            </Section>

            <Section id="tooltip" title="Tooltip">
              <div className="grid gap-4 md:grid-cols-2">
                <DemoCard label="Basic">
                  <Tooltip>
                    <TooltipTrigger
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Hover for tip
                    </TooltipTrigger>
                    <TooltipPopup>Helpful context</TooltipPopup>
                  </Tooltip>
                </DemoCard>
                <DemoCard label="Real-world — Icon buttons">
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <SettingsIcon />
                      </TooltipTrigger>
                      <TooltipPopup>Settings</TooltipPopup>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <BellIcon />
                      </TooltipTrigger>
                      <TooltipPopup>Notifications</TooltipPopup>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <HeartIcon />
                      </TooltipTrigger>
                      <TooltipPopup>Favorite</TooltipPopup>
                    </Tooltip>
                  </div>
                </DemoCard>
              </div>
            </Section>

            <Section
              id="checkbox-group"
              title="CheckboxGroup"
              desc="controlled group"
            >
              <DemoCard label="Preferences">
                <CheckboxGroup defaultValue={["email"]}>
                  <Label className="gap-2">
                    <Checkbox value="email" /> Email updates
                  </Label>
                  <Label className="gap-2">
                    <Checkbox value="sms" /> SMS alerts
                  </Label>
                  <Label className="gap-2">
                    <Checkbox value="push" /> Push notifications
                  </Label>
                </CheckboxGroup>
              </DemoCard>
            </Section>

            <Section
              id="field"
              title="Field"
              desc="label + control + description"
            >
              <DemoCard label="With description">
                <Field>
                  <FieldLabel>Username</FieldLabel>
                  <Input placeholder="johndoe" />
                  <FieldDescription>
                    Public handle, 3–16 chars.
                  </FieldDescription>
                </Field>
              </DemoCard>
            </Section>

            <Section id="fieldset" title="Fieldset" desc="grouped fields">
              <DemoCard label="Address">
                <Fieldset>
                  <FieldsetLegend>Delivery address</FieldsetLegend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Street</FieldLabel>
                      <Input placeholder="123 Main St" />
                    </Field>
                    <Field>
                      <FieldLabel>City</FieldLabel>
                      <Input placeholder="San Francisco" />
                    </Field>
                  </div>
                </Fieldset>
              </DemoCard>
            </Section>

            <Section id="frame" title="Frame" desc="generic container">
              <DemoCard label="Media frame">
                <Frame className="bg-muted/20 rounded-xl border p-6 text-center text-sm">
                  Frame — wrap images, code, or embeds with consistent
                  border/radius.
                </Frame>
              </DemoCard>
            </Section>

            <Section id="label" title="Label" desc="a11y label">
              <DemoCard label="Associated">
                <Field>
                  <FieldLabel htmlFor="label-demo">Email address</FieldLabel>
                  <Input id="label-demo" placeholder="you@example.com" />
                </Field>
              </DemoCard>
            </Section>

            <Section
              id="segmented-control"
              title="SegmentedControl"
              desc="alias — implemented via Tabs variant (see coss docs)"
            >
              <DemoCard label="View switch (Tabs as segmented)">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTab value="all">All</TabsTab>
                    <TabsTab value="active">Active</TabsTab>
                    <TabsTab value="archived">Archived</TabsTab>
                  </TabsList>
                  <TabsPanel value="all">
                    <div className="rounded-lg border p-3 text-sm">
                      All projects
                    </div>
                  </TabsPanel>
                  <TabsPanel value="active">
                    <div className="rounded-lg border p-3 text-sm">
                      Active only
                    </div>
                  </TabsPanel>
                </Tabs>
                <p className="text-muted-foreground mt-2 text-xs">
                  COSS segmented-control shares styling with Tabs — same{" "}
                  <code>segmentedControl</code> lib, no separate component
                  export.
                </p>
              </DemoCard>
            </Section>

            <Section id="spinner" title="Spinner">
              <DemoCard label="Loading">
                <div className="flex items-center gap-4">
                  <Spinner />
                  <Spinner className="size-6" />
                  <span className="inline-flex items-center gap-2 text-sm">
                    <LoaderCircleIcon className="size-4 animate-spin" />{" "}
                    Syncing…
                  </span>
                </div>
              </DemoCard>
            </Section>

            <Section
              id="drawer"
              title="Drawer"
              desc="bottom sheet — see Dialog section"
            >
              <DemoCard label="Drawer — mobile cart">
                <p className="text-muted-foreground text-sm">
                  Full Drawer demo is inside the Dialog section above (combined
                  real-world cart example).{" "}
                  <a href="#dialog" className="underline">
                    Jump to Dialog
                  </a>
                </p>
              </DemoCard>
            </Section>

            <Section
              id="sheet"
              title="Sheet"
              desc="side overlay — see Dialog section"
            >
              <DemoCard label="Sheet — side panel">
                <p className="text-muted-foreground text-sm">
                  Sheet demo lives in the Dialog section (Settings sheet).{" "}
                  <a href="#dialog" className="underline">
                    Jump to Dialog
                  </a>
                </p>
              </DemoCard>
            </Section>

            <Section
              id="preview-card"
              title="PreviewCard"
              desc="link hover preview"
            >
              <DemoCard label="Real-world — Blog link">
                <PreviewCard>
                  <PreviewCardTrigger className="underline decoration-dotted">
                    Read: Building with COSS →
                  </PreviewCardTrigger>
                  <PreviewCardPopup className="bg-popover max-w-xs rounded-lg border p-3 text-sm shadow-md">
                    PreviewCard shows rich hover preview with delay — used for
                    links, user cards, article previews.
                  </PreviewCardPopup>
                </PreviewCard>
              </DemoCard>
            </Section>

            <Section
              id="sidebar"
              title="Sidebar"
              desc="layout chrome — real world app shell preview"
            >
              <DemoCard label="App shell — docs style">
                <div className="grid h-56 grid-cols-[160px_1fr] gap-0 overflow-hidden rounded-lg border">
                  <div className="bg-muted/40 flex flex-col gap-1 border-r p-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold">
                      <LayoutDashboardIcon className="size-4" /> Dashboard
                    </div>
                    <div className="bg-accent rounded-md px-2 py-1.5 text-sm font-medium">
                      Projects
                    </div>
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">
                      Calendar
                    </div>
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">
                      Settings
                    </div>
                    <div className="mt-auto flex items-center gap-2 border-t px-2 pt-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-xs">AL</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">Ada</span>
                    </div>
                  </div>
                  <div className="bg-background p-4">
                    <h3 className="font-medium">Projects</h3>
                    <p className="text-muted-foreground text-sm">
                      3 active projects • Select from sidebar to view details.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border p-3 text-sm">
                        <BarChart3Icon className="mb-1 size-4" /> Analytics
                        <br />
                        <span className="text-muted-foreground text-xs">
                          Last 7 days
                        </span>
                      </div>
                      <div className="rounded-lg border p-3 text-sm">
                        <UsersIcon className="mb-1 size-4" /> Team
                        <br />
                        <span className="text-muted-foreground text-xs">
                          12 members
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Section>

            <div className="text-muted-foreground py-6 text-center text-xs">
              End — {NAV.length} components • particles from cosscom/coss
              adapted to @/components/ui/tailwind
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
