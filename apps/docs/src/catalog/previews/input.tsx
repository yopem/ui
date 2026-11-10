import { Input } from "@registry/components/ui/input"
import {
  InputGroup,
  InputGroupInput,
} from "@registry/components/ui/input-group"
import { Stack } from "@registry/components/ui/stack"
import * as stylex from "@stylexjs/stylex"

export function Preview() {
  return (
    <Stack>
      <Input
        aria-label="Enter text"
        placeholder="Observation title"
        type="text"
      />
      <Input
        aria-label="Borderless input"
        aria-invalid="true"
        bordered={false}
        nativeInput
        placeholder="Borderless input"
      />
      <Input
        aria-label="Disabled borderless input"
        bordered={false}
        disabled
        placeholder="Disabled input"
      />
      <Input
        aria-label="Restored input border"
        bordered={false}
        controlXstyle={previewStyles.border}
        placeholder="Restored border"
      />
      <InputGroup bordered={false}>
        <InputGroupInput
          aria-label="Borderless group input"
          placeholder="Search notes"
        />
      </InputGroup>
    </Stack>
  )
}

const previewStyles = stylex.create({
  border: {
    borderWidth: 1,
  },
})
