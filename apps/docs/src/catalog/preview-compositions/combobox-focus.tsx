"use client"

import { Dialog as NativeDialog } from "@base-ui/react/dialog"
import { Field as NativeField } from "@base-ui/react/field"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  type ComboboxPrimitive,
} from "@registry/components/ui/combobox"
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Heading } from "@registry/components/ui/heading"
import { HStack } from "@registry/components/ui/hstack"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@registry/components/ui/menu"
import { NativeSelect } from "@registry/components/ui/native-select"
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react"

const equipment = Array.from(
  { length: 40 },
  (_, index) => `Station ${String(index + 1).padStart(2, "0")} kit`,
)

const styles = stylex.create({
  workflows: { inlineSize: "100%", maxInlineSize: "36rem" },
  picker: { flex: 1 },
  options: { maxBlockSize: "min(var(--available-height), 12rem)" },
  inlineOptions: { blockSize: "12rem" },
  nativeBackdrop: {
    backgroundColor: `color-mix(in srgb, ${tokens["--foreground"]} 30%, transparent)`,
    position: "fixed",
    inset: 0,
    zIndex: 50,
  },
  nativePopup: {
    backgroundColor: tokens["--popover"],
    color: tokens["--popover-foreground"],
    borderRadius: tokens["--radius-md"],
    position: "fixed",
    insetBlockStart: "15%",
    insetInlineStart: "5%",
    inlineSize: "90%",
    maxInlineSize: "32rem",
    maxBlockSize: "80dvh",
    overflowY: "visible",
    padding: `calc(${tokens["--spacing"]} * 6)`,
    zIndex: 50,
  },
})

type ClosePolicy = "accept" | "cancel" | "ignore" | "defer" | "retain"

type Presentation = "nonmodal" | "modal" | "inline"

function EquipmentOptions() {
  return (
    <>
      <ComboboxEmpty>No equipment found.</ComboboxEmpty>
      <ComboboxList aria-label="Station kits">
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  )
}

export function EquipmentPicker({
  name,
  container,
  actionsRef,
  inputRef,
  open,
  onOpenChange,
  presentation = "nonmodal",
  popupId,
  children,
}: {
  name?: string
  container?: HTMLElement | null
  actionsRef?: ComboboxPrimitive.Root.Props<string>["actionsRef"]
  inputRef?: Ref<HTMLInputElement>
  open?: boolean
  onOpenChange?: ComboboxPrimitive.Root.Props<string>["onOpenChange"]
  presentation?: Presentation
  popupId?: string
  children?: ReactNode
}) {
  const anchor = useRef<HTMLDivElement | null>(null)
  const inline = presentation === "inline"

  return (
    <Combobox
      items={equipment}
      inline={inline}
      modal={presentation === "modal"}
      open={inline ? true : open}
      actionsRef={actionsRef}
      onOpenChange={onOpenChange}
    >
      <Box ref={anchor}>
        <ComboboxInput
          aria-label={name}
          ref={inputRef}
          showTrigger={false}
          render={<Input nativeInput />}
        />
      </Box>
      {inline ? (
        <Box data-testid="equipment-inline" xstyle={styles.inlineOptions}>
          <EquipmentOptions />
        </Box>
      ) : (
        <ComboboxPopup
          data-testid={popupId}
          xstyle={styles.options}
          anchor={anchor}
          portalProps={{ container }}
          render={(props) => <Box {...props} />}
        >
          <EquipmentOptions />
          {children}
        </ComboboxPopup>
      )}
    </Combobox>
  )
}

export function EquipmentReservation() {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const [attachHost] = useState(
    () =>
      function attachHost(node: HTMLDivElement | null) {
        if (node) setContainer(node.closest("main"))
      },
  )

  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(true)
  const [backupMounted, setBackupMounted] = useState(true)
  const [pendingClose, setPendingClose] = useState(false)
  const [policy, setPolicy] = useState<ClosePolicy>("accept")
  const [presentation, setPresentation] = useState<Presentation>("nonmodal")
  const [reservations, setReservations] = useState(0)
  const [beforeActivations, setBeforeActivations] = useState(0)
  const [generation, setGeneration] = useState(0)
  const [oldDetached, setOldDetached] = useState(true)
  const [refCounts, setRefCounts] = useState({ attached: 0, cleaned: 0 })

  const previousActions =
    useRef<ComboboxPrimitive.Root.Props<string>["actionsRef"]>(undefined)

  const firstActions = useRef<ComboboxPrimitive.Root.Actions | null>(null)
  const secondActions = useRef<ComboboxPrimitive.Root.Actions | null>(null)

  const [inputRefs] = useState(() => [
    function firstInput(node: HTMLInputElement | null) {
      if (!node) return
      setRefCounts((counts) => ({ ...counts, attached: counts.attached + 1 }))

      return () =>
        setRefCounts((counts) => ({ ...counts, cleaned: counts.cleaned + 1 }))
    },
    function secondInput(node: HTMLInputElement | null) {
      if (!node) return
      setRefCounts((counts) => ({ ...counts, attached: counts.attached + 1 }))

      return () =>
        setRefCounts((counts) => ({ ...counts, cleaned: counts.cleaned + 1 }))
    },
  ])

  const actionsRef = generation % 2 === 0 ? firstActions : secondActions

  function changeOpen(
    next: boolean,
    details: ComboboxPrimitive.Root.OpenChangeEventDetails,
  ) {
    if (next) {
      setOpen(true)

      return
    }

    if (policy === "defer") setPendingClose(true)

    if (policy === "cancel") details.cancel()

    if (policy === "cancel" || policy === "ignore" || policy === "defer") return

    if (policy === "retain") details.preventUnmountOnClose()
    setOpen(false)
  }

  function replaceRefs() {
    previousActions.current = actionsRef
    setOldDetached(false)
    setGeneration((value) => value + 1)
  }

  function closeEquipment() {
    setOldDetached(!previousActions.current?.current)
    actionsRef.current?.close()
  }

  function closeWithShortcut(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "F4") return
    event.preventDefault()
    closeEquipment()
  }

  return (
    <Stack ref={attachHost}>
      <Heading render={<h4>Reserve station equipment</h4>} />
      <Text>
        Choose a kit. Use Tab to continue your reservation. Press F4 to close
        the popup.
      </Text>
      <Wrap>
        <Field>
          <FieldLabel htmlFor="equipment-close-policy">Close policy</FieldLabel>
          <NativeSelect
            id="equipment-close-policy"
            value={policy}
            onChange={(event) => {
              const value = event.currentTarget.value

              if (
                value === "accept" ||
                value === "cancel" ||
                value === "ignore" ||
                value === "defer" ||
                value === "retain"
              )
                setPolicy(value)
            }}
          >
            <option value="accept">Accept close</option>
            <option value="cancel">Cancel close</option>
            <option value="ignore">Ignore close</option>
            <option value="defer">Defer close</option>
            <option value="retain">Retain closing popup</option>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="equipment-presentation">
            Equipment presentation
          </FieldLabel>
          <NativeSelect
            id="equipment-presentation"
            value={presentation}
            onChange={(event) => {
              const value = event.currentTarget.value

              if (
                value === "nonmodal" ||
                value === "modal" ||
                value === "inline"
              ) {
                setOpen(false)
                setPresentation(value)
              }
            }}
          >
            <option value="nonmodal">Nonmodal popup</option>
            <option value="modal">Modal popup</option>
            <option value="inline">Inline list</option>
          </NativeSelect>
        </Field>
      </Wrap>
      <Label htmlFor="equipment-reservation-note">Reservation note</Label>
      <Input id="equipment-reservation-note" />
      <a href="#equipment-details">Equipment details</a>
      <Wrap>
        <Button variant="outline" onClick={closeEquipment}>
          Close equipment
        </Button>
        <Button
          variant="outline"
          data-pending-close={pendingClose}
          onClick={() => {
            setOpen(false)
            setPendingClose(false)
          }}
        >
          Commit equipment close
        </Button>
        <Button variant="outline" onClick={() => actionsRef.current?.unmount()}>
          Finish equipment close
        </Button>
        <Button variant="outline" onClick={replaceRefs}>
          Replace equipment refs
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setOpen(false)
            setMounted((value) => !value)
          }}
        >
          {mounted ? "Hide equipment picker" : "Show equipment picker"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setBackupMounted((value) => !value)}
        >
          {backupMounted ? "Remove backup picker" : "Add backup picker"}
        </Button>
      </Wrap>
      {backupMounted ? (
        <EquipmentPicker name="Backup equipment" container={container} />
      ) : null}
      <Button
        variant="outline"
        data-activations={beforeActivations}
        onClick={() => setBeforeActivations((count) => count + 1)}
      >
        Before equipment
      </Button>
      <HStack onKeyDown={closeWithShortcut}>
        <Box xstyle={styles.picker}>
          {mounted ? (
            <EquipmentPicker
              key={presentation}
              name="Equipment"
              container={container}
              open={open}
              onOpenChange={changeOpen}
              actionsRef={actionsRef}
              inputRef={inputRefs[generation % 2]}
              presentation={presentation}
              popupId="equipment-popup"
            />
          ) : null}
        </Box>
        <Button
          data-reservations={reservations}
          onClick={() => setReservations((count) => count + 1)}
        >
          Reserve equipment
        </Button>
      </HStack>

      <Text
        data-testid="equipment-ref-state"
        data-old-actions-detached={oldDetached}
        data-ref-balance={refCounts.attached - refCounts.cleaned}
        data-ref-attached={refCounts.attached}
        data-ref-cleaned={refCounts.cleaned}
      >
        Reservations: {reservations}. Connected input refs:{" "}
        {refCounts.attached - refCounts.cleaned}.
      </Text>
      <Text id="equipment-details">
        Each kit contains a recorder, compass, notebook, and spare batteries.
      </Text>
    </Stack>
  )
}

export function EquipmentPlan() {
  const [mounted, setMounted] = useState(true)

  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(
    null,
  )

  const [popoverContainer, setPopoverContainer] =
    useState<HTMLDivElement | null>(null)

  if (!mounted)
    return (
      <Button variant="outline" onClick={() => setMounted(true)}>
        Restore plan
      </Button>
    )

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Plan equipment
      </DialogTrigger>
      <DialogPopup ref={setDialogContainer}>
        <Stack>
          <DialogTitle>Equipment plan</DialogTitle>
          <DialogDescription>
            Choose equipment and review the plan.
          </DialogDescription>
          <EquipmentPicker name="Dialog equipment" container={dialogContainer}>
            <Popover modal={false}>
              <PopoverTrigger render={<Button variant="outline" />}>
                Kit contents
              </PopoverTrigger>
              <PopoverPopup portalProps={{ container: dialogContainer }}>
                <PopoverTitle>Kit contents</PopoverTitle>
                <Text>Recorder, compass, notebook, and spare batteries.</Text>
              </PopoverPopup>
            </Popover>
          </EquipmentPicker>
          <Popover modal={false}>
            <PopoverTrigger render={<Button variant="outline" />}>
              Plan details
            </PopoverTrigger>
            <PopoverPopup
              ref={setPopoverContainer}
              portalProps={{ container: dialogContainer }}
            >
              <Stack>
                <PopoverTitle>Plan details</PopoverTitle>
                <EquipmentPicker
                  name="Popover equipment"
                  container={popoverContainer}
                />
                <Menu>
                  <MenuTrigger render={<Button variant="outline" />}>
                    Plan actions
                  </MenuTrigger>
                  <MenuPopup portalProps={{ container: popoverContainer }}>
                    <MenuItem>Save plan</MenuItem>
                    <MenuItem>Print plan</MenuItem>
                  </MenuPopup>
                </Menu>
              </Stack>
            </PopoverPopup>
          </Popover>
          <Button variant="outline" onClick={() => setMounted(false)}>
            Remove plan
          </Button>
        </Stack>
      </DialogPopup>
    </Dialog>
  )
}

export function NativeEquipmentHost() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  return (
    <NativeDialog.Root>
      <NativeDialog.Trigger render={<Button variant="outline" />}>
        Open native host
      </NativeDialog.Trigger>
      <NativeDialog.Portal>
        <NativeDialog.Backdrop {...stylex.props(styles.nativeBackdrop)} />
        <NativeDialog.Popup {...stylex.props(styles.nativePopup)}>
          <Stack>
            <NativeDialog.Title
              render={<Heading render={<h4>Native equipment host</h4>} />}
            >
              Native equipment host
            </NativeDialog.Title>
            <NativeDialog.Description render={<Text />}>
              This host uses original Base UI Dialog and Field contexts. Its
              child popup uses an explicit local container.
            </NativeDialog.Description>
            <NativeField.Root
              name="native-equipment"
              data-testid="native-equipment-field"
            >
              <Stack>
                <NativeField.Label render={<Label />}>
                  Native equipment
                </NativeField.Label>
                <EquipmentPicker container={container} />
              </Stack>
            </NativeField.Root>
            <NativeDialog.Close render={<Button />}>
              Native host done
            </NativeDialog.Close>
            <Box ref={setContainer} data-testid="native-equipment-portal" />
          </Stack>
        </NativeDialog.Popup>
      </NativeDialog.Portal>
    </NativeDialog.Root>
  )
}

export function Preview() {
  return (
    <Stack data-testid="combobox-focus-workflows" xstyle={styles.workflows}>
      <EquipmentReservation />
      <EquipmentPlan />
      <NativeEquipmentHost />
    </Stack>
  )
}
