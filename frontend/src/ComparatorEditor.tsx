import { Em, Link, Stack, Tabs, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getFriendlyHash } from "./hash";
import PreScroll from "./PreScroll";

interface ComparatorEditorProps {
  challenge: string;
  solution: string;
  vw: number;
}

export default function ComparatorEditor({ vw, challenge, solution }: ComparatorEditorProps) {
  const [hash, setHash] = useState<null | Awaited<ReturnType<typeof getFriendlyHash>>>(null);
  useEffect(() => {
    getFriendlyHash(challenge)
      .then(setHash)
      .catch((err) => {
        console.error(`Unexpected error ${err}`);
      });
    return () => {
      setHash(null);
    };
  }, [challenge]);

  const friendlyHash = hash ? hash.friendly.map(({ word }) => word).join("-") : "";
  const nth = ["first", "second", "third"];

  return (
    <Tabs.Root defaultValue="solution" style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
      <Tabs.List style={{ marginBottom: 0 }}>
        <Tabs.Trigger value="challenge">Challenge ({friendlyHash})</Tabs.Trigger>
        <Tabs.Trigger value="solution">Candidate Solution</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        paddingInline="var(--chakra-spacing-3)"
        value="challenge"
        style={{ paddingTop: 0, width: "100%", height: "100%", overflow: "scroll" }}
      >
        <Stack paddingTop="var(--chakra-spacing-3)">
          Challenge:
          <PreScroll vw={vw} messages={[challenge.trim()]} />
          {hash && (
            <>
              <Text>
                Challenges are hashed (
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Link to docs, we create a hash to avoid certain shenagians");
                  }}
                >
                  why?
                </Link>
                ). The "friendly" name of this hash is{" "}
                <Em>
                  {hash.friendly.map((a, i) => (
                    <span key={i}>
                      {i === 3 ? (
                        <span
                          title={`The adjective "${a.word}" is derived from the ${nth[i]} byte in the SHA-256 hash ("${a.str}")`}
                        >
                          {a.word}
                        </span>
                      ) : (
                        <span
                          title={`The noun "${a.word}" is derived from the first six bits of the fourth byte in the SHA-256 hash ("${a.str}")`}
                        >
                          {a.word}
                        </span>
                      )}
                      {i < 3 ? "-" : ""}
                    </span>
                  ))}
                </Em>
                , the full SHA-256 hash is
              </Text>
              <PreScroll vw={vw} messages={[hash.hash]} />
            </>
          )}
        </Stack>
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
