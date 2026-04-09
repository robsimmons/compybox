import { useEffect, useState } from "react";
import type { EditorState } from "./types";
import { z } from "zod";
import { Code, Em, Link, Stack, Text } from "@chakra-ui/react";
import PreScroll from "./PreScroll";

interface VerifyTabProps {
  state: EditorState;
  vw: number;
  setStatus: (status: "waiting" | "checked" | "warning" | "error") => void;
}

const zJobStatus = z.union([
  z.object({ type: z.literal("failure"), text: z.string() }),
  z.object({ type: z.literal("sorry"), where: z.string() }),
  z.object({ type: z.literal("empty") }),
  z.object({
    type: z.literal("partial"),
    axioms: z.array(z.string()),
    signature: z.array(z.string()),
  }),
  z.object({ type: z.literal("full"), signature: z.array(z.string()) }),
]);

const boxStyle = { paddingInline: "var(--chakra-spacing-3)" };

export default function VerifyTab({ vw, state, setStatus: setExternalStatus }: VerifyTabProps) {
  const [jobStatus, setJobStatus] = useState<null | z.infer<typeof zJobStatus>>(null);
  const [storedEditorState, setStoredEditorState] = useState(state);

  useEffect(() => {
    let cancelled = false;
    const request =
      storedEditorState.type === "simple"
        ? { type: "simple", project: "MathlibDemo", code: storedEditorState.code }
        : {
            type: "comparator",
            project: "MathlibDemo",
            challenge: storedEditorState.challenge,
            solution: storedEditorState.solution,
          };

    setExternalStatus("waiting");
    fetch("/compybox/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return;
        const jobStatus = zJobStatus.parse(json);
        setJobStatus(jobStatus);
        switch (jobStatus.type) {
          case "sorry":
            setExternalStatus("error");
            break;
          case "empty":
            setExternalStatus("warning");
            break;
          case "full":
            setExternalStatus("checked");
            break;
          case "failure":
            setExternalStatus("error");
            break;
          case "partial":
            if (storedEditorState.type === "comparator") {
              setExternalStatus("error");
            } else {
              setExternalStatus("warning");
            }
            break;
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setExternalStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [storedEditorState, setExternalStatus]);

  if (storedEditorState !== state) {
    setJobStatus(null);
    setStoredEditorState(state);
  }

  if (jobStatus === null) return <Stack style={boxStyle}>Waiting for server to respond</Stack>;
  switch (jobStatus.type) {
    case "failure":
      return (
        <Stack style={boxStyle}>
          <Text>
            The current Lean file failed verification; its contents should not treated as reliable.
            The Nanoda kernel gave the following error messages:
          </Text>
          <PreScroll vw={vw} messages={[jobStatus.text]} />
        </Stack>
      );
    case "empty":
      return (
        <Stack style={boxStyle}>
          <Text>
            This Lean file does not generate any information that is sent to Lean's kernel for
            verification.
          </Text>
        </Stack>
      );
    case "sorry":
      return (
        <Stack style={boxStyle}>
          <Text>
            The current Lean file failed verification: <Code>{jobStatus.where}</Code> uses the{" "}
            <Code>sorryAx</Code> axiom that can be used to prove anything.
          </Text>
          <Text>
            Would you like to{" "}
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                alert("This would create a new challenge, which would open in a new window/tab");
              }}
            >
              generate a challenge from this code
            </Link>
            ?
          </Text>
        </Stack>
      );
    case "full":
      if (state.type === "comparator") {
        return (
          <Stack style={boxStyle}>
            <Text>
              The Lean kernel has verified that the contents of the Candidate Solution represent a
              valid solution to the problem posed in the challenge file (SHA256 hash{" "}
              <Code style={{ fontFamily: "monospace" }}>{state.hash}</Code>, friendly name{" "}
              <Em>{state.friendlyHash}</Em>).
            </Text>
          </Stack>
        );
      } else {
        return (
          <Stack style={boxStyle}>
            <Text>
              The Lean kernel and the Nanoda kernel have verified the following contents for the
              file, using only{" "}
              <Link
                href="https://lean-lang.org/doc/reference/latest/Axioms/#standard-axioms"
                target="_blank"
              >
                standard axioms
              </Link>
              :
            </Text>
            <PreScroll vw={vw} messages={jobStatus.signature} />
            <Text>
              If you're concerned about whether these verified statements actually match the theorem
              statements in your input file, you can use{" "}
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    "This would link to a page that explains challenge mode and how to enable it",
                  );
                }}
              >
                Challenge Mode
              </Link>
              .
            </Text>
          </Stack>
        );
      }
    case "partial":
      return (
        <Stack style={boxStyle}>
          <Text>
            The Lean kernel and the Nanoda kernel <strong>cannot</strong> fully verify this
            development, because it uses axioms aside from the{" "}
            <Link
              href="https://lean-lang.org/doc/reference/latest/Axioms/#standard-axioms"
              target="_blank"
            >
              standard three
            </Link>
            .
          </Text>
          <Text>
            Specifically, it uses {jobStatus.axioms.length > 1 ? "these axioms" : "this axiom"}:
          </Text>
          <PreScroll vw={vw} messages={jobStatus.axioms} />
          {state.type === "simple" && (
            <>
              <Text>
                If you have an expert-level understanding of the axiom above and its consequences in
                Lean's type theory, then you can trust the Lean kernel's verification of the
                following contents for the file:
              </Text>
              <PreScroll vw={vw} messages={jobStatus.signature} />
            </>
          )}
        </Stack>
      );
  }
}
