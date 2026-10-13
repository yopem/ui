import { Heading } from "@registry/components/ui/heading"

export function Preview() {
  return (
    <>
      <Heading render={<h1>Page title</h1>} />
      <Heading>Section title</Heading>
      <Heading render={<h3>Subsection title</h3>} />
      <Heading render={<h4>Fourth-level title</h4>} />
      <Heading render={<h5>Fifth-level title</h5>} />
      <Heading render={<h6>Sixth-level title</h6>} />
    </>
  )
}
