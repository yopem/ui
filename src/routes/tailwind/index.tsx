import { createFileRoute } from "@tanstack/react-router"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  FolderIcon,
  HeartIcon,
  InboxIcon,
  LoaderCircleIcon,
  MailIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TrashIcon,
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
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/tailwind/alert-dialog"
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
} from "@/components/ui/tailwind/card"
import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { CheckboxGroup } from "@/components/ui/tailwind/checkbox-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/tailwind/collapsible"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/tailwind/dialog"
import {
  Drawer,
  DrawerBackdrop,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
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
  InputGroupText,
} from "@/components/ui/tailwind/input-group"
import { Kbd, KbdGroup } from "@/components/ui/tailwind/kbd"
import { Label } from "@/components/ui/tailwind/label"
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
  SheetBackdrop,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground mt-4 mb-2 text-xs font-medium tracking-widest uppercase">
      {children}
    </div>
  )
}

const NAV = [
  "Button",
  "Badge",
  "Alert",
  "Avatar",
  "Card",
  "Input",
  "Textarea",
  "Select",
  "Toggle",
  "ToggleGroup",
  "Group",
  "InputGroup",
  "Tabs",
  "Table",
  "Empty",
  "Checkbox",
  "Radio",
  "Switch",
  "Slider",
  "Progress",
  "Meter",
  "Separator",
  "Breadcrumb",
  "Pagination",
  "Accordion",
  "Collapsible",
  "Kbd",
  "Label",
  "Skeleton",
  "Calendar",
  "Dialog",
  "Popover",
  "Tooltip",
  "PreviewCard",
  "ScrollArea",
  "Toolbar",
  "Form",
  "Others",
]

function RouteComponent() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-semibold">
              Tailwind UI Library — Preview
            </h1>
            <p className="text-muted-foreground text-xs">
              All components in src/components/ui/tailwind • variants / sizes /
              states
            </p>
          </div>
          <a
            className={buttonVariants({ size: "sm", variant: "outline" })}
            href="#button"
          >
            Jump to components
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[200px_1fr]">
        <nav className="hidden h-fit lg:sticky lg:top-[65px] lg:block">
          <div className="bg-card rounded-xl border p-3">
            <div className="mb-2 text-xs font-semibold tracking-widest uppercase opacity-60">
              Components
            </div>
            <div className="flex max-h-[calc(100vh-120px)] flex-col gap-0.5 overflow-auto">
              {NAV.map((n) => {
                const id = n.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                return (
                  <a
                    className="hover:bg-accent rounded-md px-2 py-1 text-sm"
                    href={`#${id}`}
                    key={n}
                  >
                    {n}
                  </a>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="flex flex-col gap-6">
          <Section
            desc="variant: default / destructive / destructive-outline / ghost / link / outline / secondary • size: xs / sm / default / lg / xl / icon*"
            id="button"
            title="Button"
          >
            <SubLabel>Variants</SubLabel>
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
            <SubLabel>Sizes</SubLabel>
            <div className="flex flex-wrap items-center gap-2">
              {(["xs", "sm", "default", "lg", "xl"] as const).map((s) => (
                <Button key={s} size={s}>
                  size {s}
                </Button>
              ))}
              <Button aria-label="icon" size="icon" variant="outline">
                <HeartIcon />
              </Button>
              <Button aria-label="icon-sm" size="icon-sm" variant="outline">
                <HeartIcon />
              </Button>
              <Button aria-label="icon-lg" size="icon-lg" variant="outline">
                <HeartIcon />
              </Button>
            </div>
            <SubLabel>States</SubLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
              <Button variant="outline">
                <MailIcon /> With icon
              </Button>
              <Button size="sm" variant="outline">
                <ArrowRightIcon /> Small
              </Button>
            </div>
          </Section>

          <Section
            desc="variant: default / destructive / error / info / outline / secondary / success / warning • size: sm / default / lg"
            id="badge"
            title="Badge"
          >
            <SubLabel>Variants</SubLabel>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "default",
                  "destructive",
                  "error",
                  "info",
                  "outline",
                  "secondary",
                  "success",
                  "warning",
                ] as const
              ).map((v) => (
                <Badge key={v} variant={v}>
                  {v}
                </Badge>
              ))}
            </div>
            <SubLabel>Sizes</SubLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge size="sm">sm</Badge>
              <Badge size="default">default</Badge>
              <Badge size="lg">lg</Badge>
              <Badge size="lg" variant="outline">
                outline lg
              </Badge>
            </div>
          </Section>

          <Section
            desc="variant: default / error / info / success / warning"
            id="alert"
            title="Alert"
          >
            <div className="grid gap-3">
              {(
                ["default", "error", "info", "success", "warning"] as const
              ).map((v) => (
                <Alert key={v} variant={v}>
                  <AlertCircleIcon />
                  <AlertTitle>{v} alert</AlertTitle>
                  <AlertDescription>
                    This is a {v} alert with description.
                  </AlertDescription>
                  {v === "default" ? (
                    <AlertAction>
                      <Button size="xs" variant="outline">
                        Action
                      </Button>
                    </AlertAction>
                  ) : null}
                </Alert>
              ))}
            </div>
          </Section>

          <Section id="avatar" title="Avatar">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar>
                <AvatarImage
                  alt="avatar"
                  src="https://i.pravatar.cc/100?img=1"
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
          </Section>

          <Section id="card" title="Card">
            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card title</CardTitle>
                  <CardDescription>Card description goes here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Card content with body text and layout.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                  <Button size="sm" variant="outline">
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Second card</CardTitle>
                  <CardDescription>Another variant.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="input" title="Input / NumberField / OTPField">
            <div className="grid max-w-2xl gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Default input" />
                <Input disabled placeholder="Disabled" />
                <Input aria-invalid placeholder="Invalid" />
                <Input placeholder="Search..." type="search" />
                <Input type="file" />
              </div>
              <div className="flex flex-wrap gap-4">
                <NumberField defaultValue={2} max={10} min={0} />
                <OTPField length={6}>
                  <OTPFieldInput />
                  <OTPFieldInput />
                  <OTPFieldInput />
                  <OTPFieldInput />
                  <OTPFieldInput />
                  <OTPFieldInput />
                </OTPField>
              </div>
            </div>
          </Section>

          <Section id="textarea" title="Textarea">
            <Textarea
              className="max-w-xl"
              placeholder="Write something..."
              rows={3}
            />
          </Section>

          <Section desc="size: default / sm / lg" id="select" title="Select">
            <div className="flex flex-wrap gap-3">
              {(["default", "sm", "lg"] as const).map((s) => (
                <Select key={s} defaultValue="apple">
                  <SelectButton size={s} style={{ width: 160 }}>
                    <SelectValue />
                  </SelectButton>
                  <SelectPopup>
                    <SelectItem>apple</SelectItem>
                    <SelectItem>banana</SelectItem>
                    <SelectItem>orange</SelectItem>
                  </SelectPopup>
                </Select>
              ))}
              <Select>
                <SelectButton style={{ width: 160 }}>
                  <SelectValue placeholder="Placeholder" />
                </SelectButton>
                <SelectPopup>
                  <SelectItem>one</SelectItem>
                  <SelectItem>two</SelectItem>
                </SelectPopup>
              </Select>
            </div>
          </Section>

          <Section
            desc="variant: default / outline • size: sm / default / lg • pressed / disabled"
            id="toggle"
            title="Toggle"
          >
            <SubLabel>Variants</SubLabel>
            <div className="flex flex-wrap gap-2">
              {(["default", "outline"] as const).map((v) => (
                <Toggle key={v} variant={v}>
                  <StarIcon /> {v}
                </Toggle>
              ))}
              <Toggle pressed variant="outline">
                <StarIcon /> pressed
              </Toggle>
            </div>
            <SubLabel>Sizes</SubLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Toggle size="sm" variant="outline">
                sm
              </Toggle>
              <Toggle size="default" variant="outline">
                default
              </Toggle>
              <Toggle size="lg" variant="outline">
                lg
              </Toggle>
            </div>
          </Section>

          <Section id="toggle-group" title="ToggleGroup">
            <ToggleGroup defaultValue={["bold"]}>
              <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
              <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
              <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
            </ToggleGroup>
          </Section>

          <Section
            desc="orientation: horizontal / vertical"
            id="group"
            title="Group"
          >
            <div className="flex flex-col gap-4">
              <Group orientation="horizontal">
                <Button variant="outline">First</Button>
                <Button variant="outline">Second</Button>
                <Button variant="outline">Third</Button>
              </Group>
              <Group className="w-fit" orientation="vertical">
                <Button size="sm" variant="outline">
                  Top
                </Button>
                <Button size="sm" variant="outline">
                  Middle
                </Button>
                <Button size="sm" variant="outline">
                  Bottom
                </Button>
              </Group>
            </div>
          </Section>

          <Section
            desc="align: inline-start / inline-end / block-start / block-end"
            id="input-group"
            title="InputGroup"
          >
            <div className="grid max-w-xl gap-3">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="size-4 opacity-60" />
                </InputGroupAddon>
                <InputGroupInput placeholder="Search..." />
                <InputGroupAddon align="inline-end">
                  <Kbd>⌘K</Kbd>
                </InputGroupAddon>
              </InputGroup>
              <InputGroup>
                <InputGroupInput placeholder="you@example.com" />
                <InputGroupAddon align="inline-end">
                  <Button size="xs" variant="default">
                    Subscribe
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>@</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput placeholder="username" />
              </InputGroup>
            </div>
          </Section>

          <Section desc="variant: default / underline" id="tabs" title="Tabs">
            <div className="flex flex-col gap-6">
              <Tabs defaultValue="account">
                <TabsList variant="default">
                  <TabsTab value="account">Account</TabsTab>
                  <TabsTab value="password">Password</TabsTab>
                  <TabsTab value="settings">Settings</TabsTab>
                </TabsList>
                <TabsPanel value="account">
                  <div className="rounded-lg border p-4 text-sm">
                    Account panel
                  </div>
                </TabsPanel>
                <TabsPanel value="password">
                  <div className="rounded-lg border p-4 text-sm">
                    Password panel
                  </div>
                </TabsPanel>
              </Tabs>
              <Tabs defaultValue="account">
                <TabsList variant="underline">
                  <TabsTab value="account">Account</TabsTab>
                  <TabsTab value="password">Password</TabsTab>
                </TabsList>
                <TabsPanel value="account">
                  <div className="p-2 text-sm">Underline variant panel</div>
                </TabsPanel>
              </Tabs>
            </div>
          </Section>

          <Section desc="variant: default / card" id="table" title="Table">
            <div className="flex flex-col gap-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Alice</TableCell>
                    <TableCell>
                      <Badge size="sm" variant="success">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bob</TableCell>
                    <TableCell>
                      <Badge size="sm" variant="outline">
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$150.00</TableCell>
                  </TableRow>
                </TableBody>
                <TableCaption>Default table</TableCaption>
              </Table>
              <Table variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Carol</TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Section>

          <Section
            desc="variant: default / icon (EmptyMedia)"
            id="empty"
            title="Empty"
          >
            <div className="grid gap-4">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>No data</EmptyTitle>
                  <EmptyDescription>
                    There is nothing to show yet.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm">Create new</Button>
                </EmptyContent>
              </Empty>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <FolderIcon className="size-8 opacity-20" />
                  </EmptyMedia>
                  <EmptyTitle>Empty default</EmptyTitle>
                  <EmptyDescription>
                    Default variant without icon frame.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </Section>

          <Section id="checkbox" title="Checkbox / CheckboxGroup">
            <div className="flex flex-col gap-4">
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
                <Label className="gap-2 opacity-60">
                  <Checkbox disabled /> Disabled
                </Label>
              </div>
              <CheckboxGroup defaultValue={["a"]}>
                <Label className="gap-2">
                  <Checkbox value="a" /> Option A
                </Label>
                <Label className="gap-2">
                  <Checkbox value="b" /> Option B
                </Label>
              </CheckboxGroup>
            </div>
          </Section>

          <Section id="radio" title="RadioGroup">
            <RadioGroup defaultValue="r1">
              <Label className="gap-2">
                <Radio value="r1" /> Option 1
              </Label>
              <Label className="gap-2">
                <Radio value="r2" /> Option 2
              </Label>
              <Label className="gap-2">
                <Radio disabled value="r3" /> Disabled
              </Label>
            </RadioGroup>
          </Section>

          <Section id="switch" title="Switch">
            <div className="flex flex-wrap items-center gap-4">
              <Label className="gap-2">
                <Switch /> Default
              </Label>
              <Label className="gap-2">
                <Switch defaultChecked /> Checked
              </Label>
              <Label className="gap-2 opacity-60">
                <Switch disabled /> Disabled
              </Label>
            </div>
          </Section>

          <Section id="slider" title="Slider">
            <div className="grid max-w-xl gap-6">
              <Slider defaultValue={[40]} />
              <Slider defaultValue={[20, 80]} />
              <Slider defaultValue={[50]} max={200} min={0} />
            </div>
          </Section>

          <Section id="progress" title="Progress / Meter">
            <div className="grid max-w-xl gap-6">
              <Progress max={100} value={60}>
                <div className="flex justify-between text-sm">
                  <ProgressLabel>Progress</ProgressLabel>
                  <ProgressValue />
                </div>
                <ProgressTrack>
                  <ProgressIndicator style={{ width: "60%" }} />
                </ProgressTrack>
              </Progress>
              <Progress max={100} value={30} />
              <Meter max={100} value={70}>
                <div className="flex justify-between text-sm">
                  <MeterLabel>Storage</MeterLabel>
                  <MeterValue />
                </div>
                <MeterTrack>
                  <MeterIndicator style={{ width: "70%" }} />
                </MeterTrack>
              </Meter>
            </div>
          </Section>

          <Section id="separator" title="Separator">
            <div className="flex flex-col gap-4">
              <div className="text-sm">Above</div>
              <Separator />
              <div className="text-sm">Below</div>
              <div className="flex h-12 items-center gap-4">
                <span className="text-sm">Left</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </Section>

          <Section id="breadcrumb" title="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRightIcon className="size-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Library</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Current</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Section>

          <Section id="pagination" title="Pagination">
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
                  <PaginationLink href="#">Next ›</PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Section>

          <Section id="accordion" title="Accordion">
            <Accordion className="max-w-xl">
              <AccordionItem value="a">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionPanel>Yes, built on Base UI.</AccordionPanel>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionPanel>Yes, with Tailwind.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Section>

          <Section id="collapsible" title="Collapsible">
            <Collapsible className="max-w-xl rounded-lg border p-3" defaultOpen>
              <CollapsibleTrigger className="text-sm font-medium">
                Toggle collapsible
              </CollapsibleTrigger>
              <CollapsibleContent className="text-muted-foreground mt-2 text-sm">
                Collapsible content is visible here.
              </CollapsibleContent>
            </Collapsible>
          </Section>

          <Section id="kbd" title="Kbd">
            <div className="flex flex-wrap items-center gap-2">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>P</Kbd>
              </KbdGroup>
              <Kbd>Ctrl</Kbd>{" "}
              <span className="text-muted-foreground text-sm">+</span>{" "}
              <Kbd>C</Kbd>
            </div>
          </Section>

          <Section id="label" title="Label / Field / Fieldset">
            <div className="grid max-w-xl gap-4">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input placeholder="you@example.com" />
                <FieldDescription>
                  We will not share your email.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>With error</FieldLabel>
                <Input aria-invalid placeholder="Invalid" />
                <FieldError>Field is required</FieldError>
              </Field>
              <Fieldset>
                <FieldsetLegend>Fieldset</FieldsetLegend>
                <div className="mt-2 flex flex-col gap-2">
                  <Field>
                    <FieldLabel>First name</FieldLabel>
                    <Input placeholder="Ada" />
                  </Field>
                </div>
              </Fieldset>
              <Form className="flex flex-col gap-3">
                <Field>
                  <FieldLabel>Form input</FieldLabel>
                  <Input placeholder="inside Form" />
                </Field>
                <Button size="sm" type="submit" variant="outline">
                  Submit
                </Button>
              </Form>
            </div>
          </Section>

          <Section id="skeleton" title="Skeleton / Spinner">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full max-w-xl" />
              <div className="flex items-center gap-3">
                <Spinner />
                <Spinner className="size-6" />
                <span className="inline-flex items-center gap-2 text-sm">
                  <LoaderCircleIcon className="size-4 animate-spin" /> loading
                </span>
              </div>
            </div>
          </Section>

          <Section id="calendar" title="Calendar">
            <Calendar
              captionLayout="dropdown"
              className="max-w-fit rounded-lg border p-3 shadow-xs/5"
              defaultMonth={new Date()}
              mode="single"
            />
          </Section>

          <Section id="dialog" title="Dialog / AlertDialog / Drawer / Sheet">
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Open Dialog
                </DialogTrigger>
                <DialogBackdrop />
                <DialogPanel className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Dialog title</DialogTitle>
                    <DialogDescription>
                      Dialog description for preview.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 text-sm">Dialog body content.</div>
                  <DialogFooter>
                    <DialogClose
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      Close
                    </DialogClose>
                  </DialogFooter>
                </DialogPanel>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger
                  className={buttonVariants({
                    size: "sm",
                    variant: "destructive",
                  })}
                >
                  Alert Dialog
                </AlertDialogTrigger>
                <AlertDialogBackdrop />
                <AlertDialogPopup className="bg-background max-w-md rounded-xl border p-6 shadow-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 flex justify-end gap-2">
                    <AlertDialogClose
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      Cancel
                    </AlertDialogClose>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogPopup>
              </AlertDialog>

              <Drawer>
                <DrawerTrigger
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Drawer
                </DrawerTrigger>
                <DrawerBackdrop />
                <DrawerPanel>
                  <DrawerHeader>
                    <DrawerTitle>Drawer</DrawerTitle>
                    <DrawerDescription>Drawer description</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 text-sm">Drawer content</div>
                  <DrawerFooter>
                    <Button size="sm" variant="outline">
                      Close
                    </Button>
                  </DrawerFooter>
                </DrawerPanel>
              </Drawer>

              <Sheet>
                <SheetTrigger
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Sheet
                </SheetTrigger>
                <SheetBackdrop />
                <SheetPanel>
                  <SheetHeader>
                    <SheetTitle>Sheet</SheetTitle>
                    <SheetDescription>Sheet description</SheetDescription>
                  </SheetHeader>
                  <div className="p-4 text-sm">Sheet content</div>
                  <SheetFooter>
                    <Button size="sm" variant="outline">
                      Close
                    </Button>
                  </SheetFooter>
                </SheetPanel>
              </Sheet>
            </div>
          </Section>

          <Section id="popover" title="Popover / Tooltip / PreviewCard">
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Popover
                </PopoverTrigger>
                <PopoverPopup className="bg-popover max-w-xs rounded-lg border p-4 text-sm shadow-md">
                  Popover content — click trigger to open.
                </PopoverPopup>
              </Popover>

              <Tooltip>
                <TooltipTrigger
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Tooltip (hover)
                </TooltipTrigger>
                <TooltipPopup>Tooltip content</TooltipPopup>
              </Tooltip>

              <PreviewCard>
                <PreviewCardTrigger
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  PreviewCard (hover)
                </PreviewCardTrigger>
                <PreviewCardPopup>Preview card content.</PreviewCardPopup>
              </PreviewCard>
            </div>
          </Section>

          <Section id="scroll-area" title="ScrollArea / Frame">
            <div className="grid gap-4 sm:grid-cols-2">
              <ScrollArea className="h-32 rounded-lg border">
                <div className="p-4 text-sm">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div className="py-1" key={i}>
                      Scroll item {i + 1}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Frame className="rounded-lg border p-4 text-sm">
                Frame — generic container for content framing.
              </Frame>
            </div>
          </Section>

          <Section id="toolbar" title="Toolbar">
            <Toolbar className="flex items-center gap-1 rounded-lg border p-1">
              <Button aria-label="bold" size="icon-sm" variant="ghost">
                <StarIcon />
              </Button>
              <Separator className="mx-1 h-6" orientation="vertical" />
              <Button size="sm" variant="ghost">
                <SettingsIcon /> Settings
              </Button>
              <Button size="sm" variant="ghost">
                <TrashIcon /> Delete
              </Button>
            </Toolbar>
          </Section>

          <Section id="form" title="Form">
            <p className="text-muted-foreground text-sm">
              Form wraps Field + Input above. See Label section for full
              Field/Fieldset/Form showcase.
            </p>
          </Section>

          <Section id="others" title="Others">
            <div className="grid gap-2 text-sm">
              <p className="text-muted-foreground">
                <b>Not shown inline:</b> Menu, ContextMenu, Autocomplete,
                Combobox, Command, Sidebar, Toast — require portal/filter
                providers and are best tested in isolation. Check{" "}
                <code className="bg-muted rounded px-1">
                  src/components/ui/tailwind/*.tsx
                </code>{" "}
                per component.
              </p>
              <p className="text-muted-foreground">
                Toast: use{" "}
                <code className="bg-muted rounded px-1">Toast.Provider</code> +{" "}
                <code className="bg-muted rounded px-1">
                  Toast.useToastManager().add()
                </code>
                .
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Sidebar — layout chrome, see sidebar.tsx
                </Badge>
                <Badge variant="secondary">54 components total</Badge>
              </div>
            </div>
          </Section>

          <div className="text-muted-foreground py-6 text-center text-xs">
            End of preview • {NAV.length} sections
          </div>
        </div>
      </div>
    </div>
  )
}
