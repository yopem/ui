import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
export function Preview() {
  return (
    <Frame inlineSize={"100%"}>
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Heading
          as="h2"
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          fontWeight={"600"}
        >
          Section title
        </Heading>
        <Paragraph
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          color={"var(--muted-foreground)"}
        >
          Section description
        </Paragraph>
      </FramePanel>
      <FrameFooter>
        <Paragraph
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          color={"var(--muted-foreground)"}
        >
          Footer
        </Paragraph>
      </FrameFooter>
    </Frame>
  )
}
