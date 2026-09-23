import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Flex } from "@/components/ui/flex"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Terms & Conditions
      </DialogTrigger>
      <DialogPopup
        {...stylex.props(exampleStyles.example1)}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <Flex {...stylex.props(exampleStyles.report1)}>
            <Flex {...stylex.props(exampleStyles.example2)}>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    Acceptance of Terms
                  </Box>
                </Paragraph>
                <Paragraph>
                  By accessing and using this website, users agree to comply
                  with and be bound by these Terms of Service. Users who do not
                  agree with these terms should discontinue use of the website
                  immediately.
                </Paragraph>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    User Account Responsibilities
                  </Box>
                </Paragraph>
                <Paragraph>
                  Users are responsible for maintaining the confidentiality of
                  their account credentials. Any activities occurring under a
                  user&apos;s account are the sole responsibility of the account
                  holder. Users must notify the website administrators
                  immediately of any unauthorized account access.
                </Paragraph>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    Content Usage and Restrictions
                  </Box>
                </Paragraph>
                <Paragraph>
                  The website and its original content are protected by
                  intellectual property laws. Users may not reproduce,
                  distribute, modify, create derivative works, or commercially
                  exploit any content without explicit written permission from
                  the website owners.
                </Paragraph>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    Limitation of Liability
                  </Box>
                </Paragraph>
                <Paragraph>
                  The website provides content &ldquo;as is&rdquo; without any
                  warranties. The website owners shall not be liable for direct,
                  indirect, incidental, consequential, or punitive damages
                  arising from user interactions with the platform.
                </Paragraph>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    User Conduct Guidelines
                  </Box>
                </Paragraph>
                <Box as="ul" {...stylex.props(exampleStyles.example4)}>
                  <Box as="li">Not upload harmful or malicious content</Box>
                  <Box as="li">Respect the rights of other users</Box>
                  <Box as="li">
                    Avoid activities that could disrupt website functionality
                  </Box>
                  <Box as="li">
                    Comply with applicable local and international laws
                  </Box>
                </Box>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    Modifications to Terms
                  </Box>
                </Paragraph>
                <Paragraph>
                  The website reserves the right to modify these terms at any
                  time. Continued use of the website after changes constitutes
                  acceptance of the new terms.
                </Paragraph>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    Termination Clause
                  </Box>
                </Paragraph>
                <Paragraph>
                  The website may terminate or suspend user access without prior
                  notice for violations of these terms or for any other reason
                  deemed appropriate by the administration.
                </Paragraph>
              </Flex>
              <Flex {...stylex.props(exampleStyles.example3)}>
                <Paragraph>
                  <Box as="strong" {...stylex.props(exampleStyles.strong)}>
                    Governing Law
                  </Box>
                </Paragraph>
                <Paragraph>
                  These terms are governed by the laws of the jurisdiction where
                  the website is primarily operated, without regard to conflict
                  of law principles.
                </Paragraph>
              </Flex>
            </Flex>
          </Flex>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="button">I agree</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

const exampleStyles = stylex.create({
  example1: {
    maxInlineSize: {
      default: null,
      "@media (min-width: 40rem)": "28rem",
    },
  },
  strong: {
    color: "var(--foreground)",
    fontWeight: 600,
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example3: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example4: {
    listStyleType: "disc",
    paddingInlineStart: "calc(0.25rem * 6)",
  },
  report1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
})
