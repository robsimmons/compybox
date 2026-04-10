import { useEffect, useState } from "react";
import type { EditorState } from "./types";
import { z } from "zod";
import { Button, Code, Link, Stack, Strong, Text } from "@chakra-ui/react";
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
    type: z.literal("challenge_fail_missing"),
    const: z.string(),
    what: z.string(),
    where: z.string(),
  }),
  z.object({ type: z.literal("challenge_fail_mismatch"), const: z.string(), what: z.string() }),
  z.object({
    type: z.literal("partial"),
    axioms: z.array(z.string()),
    signature: z.array(z.string()),
  }),
  z.object({ type: z.literal("full"), signature: z.array(z.string()) }),
]);

const boxStyle = { paddingInline: "var(--chakra-spacing-3)" };

export default function VerifyTab({ vw, state, setStatus: setExternalStatus }: VerifyTabProps) {
  const [jobStatus, setJobStatus] = useState<null | false | z.infer<typeof zJobStatus>>(null);
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
            setExternalStatus("warning");
            break;
          default:
            setExternalStatus("error");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setJobStatus(false);
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
  if (jobStatus === false) {
    return <Stack style={boxStyle}>Something went wrong!</Stack>;
  }
  switch (jobStatus.type) {
    case "failure":
      return (
        <Stack style={boxStyle}>
          <Text>
            The current Lean file could not be verified, and should not be treated as a reliable
            proof of anything. The Nanoda kernel gave the following error messages:
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
            The current Lean file <Strong>could not be verified</Strong>, and should not be treated
            as a reliable proof of anything.
          </Text>
          <Text>
            The reason the file cannot be verified is that <Code>{jobStatus.where}</Code> uses the{" "}
            <Code>sorryAx</Code> axiom, and this axiom can be used to prove anything.
          </Text>
          {state.type !== "comparator" && (
            <>
              <Text>
                A Lean file that uses <Code>sorryAx</Code> can be turned into a Challenge for others
                to prove (
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      "This would be a link to a friendly explanation of the challenge workflow",
                    );
                  }}
                >
                  learn more about this
                </Link>
                ).
              </Text>{" "}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  alert("This would create a new challenge, which would open in a new window/tab");
                }}
              >
                Generate a challenge from this code
              </Button>
            </>
          )}
        </Stack>
      );
    case "full":
      if (state.type === "comparator") {
        return (
          <Stack style={boxStyle}>
            <Text>
              The Lean kernel and the Nanoda kernel have verified that the contents of the Candidate
              Solution represent a valid solution to the problem posed by the Challenge.
            </Text>
          </Stack>
        );
      } else {
        return (
          <Stack style={boxStyle}>
            <Text>
              The Lean kernel and the Nanoda kernel have verified the following statements, using
              only{" "}
              <Link
                href="https://lean-lang.org/doc/reference/latest/Axioms/#standard-axioms"
                target="_blank"
              >
                standard axioms
              </Link>
              .
            </Text>
            <PreScroll vw={vw} messages={jobStatus.signature} />
            <Text>
              (Note: proofs aren't shown in the output above; Nanoda replaces them with an
              underscore <Code>_</Code>.)
            </Text>
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
            The Lean kernel and the Nanoda kernel <Strong>cannot</Strong> fully verify this
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
          {state.type === "simple" ? (
            <>
              <Text>
                If you have an expert-level understanding of the axiom above and its consequences in
                Lean's type theory, then you can trust the Lean kernel's verification of the
                following contents for the file:
              </Text>
              <PreScroll vw={vw} messages={jobStatus.signature} />
            </>
          ) : (
            <Text>
              This web application is not designed to support the challenge workflow in the presence
              of non-standard axioms. A tool like{" "}
              <Link
                href="https://lean-lang.org/doc/reference/latest/find/?domain=Verso.Genre.Manual.section&name=validating-comparator"
                target="_blnk"
              >
                comparator
              </Link>{" "}
              could help with challenge validation in this case.
            </Text>
          )}
        </Stack>
      );
    case "challenge_fail_mismatch":
      return (
        <Stack style={boxStyle}>
          <Text>
            Challenge failed! The Candidate Solution <Strong>does not</Strong> represent a valid
            solution to the problem posed by the Challenge is not the problem posed by the
            Challenge.
          </Text>
          <Text>
            The challenge failed because the {jobStatus.what} <Code>{jobStatus.const}</Code> does
            not match between the Challenge and the Candidate Solution.
          </Text>
        </Stack>
      );
    case "challenge_fail_missing":
      return (
        <Stack style={boxStyle}>
          <Text>
            Challenge failed! The Candidate Solution <Strong>does not</Strong> represent a valid
            solution to the problem posed by the Challenge is not the problem posed by the
            Challenge.
          </Text>
          <Text>
            The challenge failed because the {jobStatus.what} <Code>{jobStatus.const}</Code> is
            missing in the {jobStatus.where}.
          </Text>
        </Stack>
      );
  }
}
