import { Tabs, Textarea } from "@chakra-ui/react";

interface ComparatorEditorProps {
  challenge: string;
  hash: string;
  friendlyHash: string;
  solution: string;
}

export default function ComparatorEditor({
  challenge,
  hash,
  friendlyHash,
  solution,
}: ComparatorEditorProps) {
  return (
    <Tabs.Root defaultValue="solution" style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
      <Tabs.List style={{ marginBottom: 0 }}>
        <Tabs.Trigger value="challenge">Challenge ({friendlyHash})</Tabs.Trigger>
        <Tabs.Trigger value="solution">Candidate Solution</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="challenge"
        style={{ paddingTop: 0, width: "100%", height: "100%", overflow: "scroll" }}
      >
        <pre>
          Challenge SHA-256 hash: {hash} {"\n"}
          Friendly name of hash: {friendlyHash}
          {"\n\n"}
          {challenge}
        </pre>
      </Tabs.Content>
      <Tabs.Content value="solution" style={{ paddingTop: 0 }}>
        <Textarea
          resize="none"
          readOnly
          value={solution}
          style={{ fontFamily: "monospace", width: "100%", height: "100%" }}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}
