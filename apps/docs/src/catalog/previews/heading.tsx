import { Heading } from "@registry/components/ui/heading"

export function Preview() {
  return (
    <>
      <Heading render={<h1>Page title</h1>} />
      <Heading>Section title</Heading>
      <Heading render={<h3>Subsection title</h3>} />
    </>
  )
}
