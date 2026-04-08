import { Box, ScrollArea, Stack } from "@chakra-ui/react";

interface PreScrollProps {
  messages: string[];
}

export default function ({ messages }: PreScrollProps) {
  return (
    <Box borderRadius="var(--chakra-spacing-3)" border="1px solid var(--chakra-colors-border)">
      <ScrollArea.Root width="calc(50vw - 2*var(--chakra-spacing-3))" size="xs">
        <ScrollArea.Viewport
          css={{
            "--scroll-shadow-size": "4rem",
            maskImage: "linear-gradient(#000, #000)",
            "&[data-overflow-x]": {
              maskImage:
                "linear-gradient(90deg,#000,#000,transparent 0,#000 var(--scroll-shadow-size),#000 calc(100% - var(--scroll-shadow-size)),transparent)",
              "&[data-at-left]": {
                maskImage:
                  "linear-gradient(90deg,#000 calc(100% - var(--scroll-shadow-size)),transparent)",
              },
              "&[data-at-right]": {
                maskImage:
                  "linear-gradient(270deg,#000 calc(100% - var(--scroll-shadow-size)),transparent)",
              },
            },
          }}
        >
          <ScrollArea.Content>
            <Stack padding="4">
              {messages.map((ax, i) => (
                <pre key={i}>{ax}</pre>
              ))}
            </Stack>
          </ScrollArea.Content>{" "}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" />
        <ScrollArea.Corner />{" "}
      </ScrollArea.Root>
    </Box>
  );
}
