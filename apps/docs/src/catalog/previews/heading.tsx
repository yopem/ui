import { Heading } from "@registry/components/ui/heading"

export function Preview() {
  return (
    <>
      <Heading render={<h1>Field station</h1>} />
      <Heading>Wetland survey</Heading>
      <Heading render={<h3>Bird observations</h3>} />
      <Heading render={<h4>Reed bed</h4>} />
      <Heading render={<h5>Morning count</h5>} />
      <Heading render={<h6>Observer notes</h6>} />
    </>
  )
}
