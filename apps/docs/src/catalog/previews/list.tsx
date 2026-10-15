"use client"

import { List, ListItem } from "@registry/components/ui/list"
import { Stack } from "@registry/components/ui/stack"

export function Preview() {
  return (
    <Stack>
      <List>
        <ListItem>Field notebook</ListItem>
        <ListItem>Water sample kit</ListItem>
      </List>
      <List render={<ol start={3} reversed />}>
        <ListItem value={7}>Record observations.</ListItem>
        <ListItem>Return equipment.</ListItem>
      </List>
    </Stack>
  )
}
