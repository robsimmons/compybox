import { useEffect, useRef, useState, type JSX } from "react";
import { type EditorState } from "./types.ts";
import SimpleEditor from "./SimpleEditor.tsx";
import ComparatorEditor from "./ComparatorEditor.tsx";
import {
  createListCollection,
  Em,
  Link,
  Portal,
  ScrollArea,
  Select,
  Splitter,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckDouble,
  faCircle,
  faSquareXmark,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { fakedata } from "./fakedata.ts";
import VerifyTab from "./VerifyTab.tsx";

const options = createListCollection({
  items: [
    { label: "Valid Proof", value: "simple-correct" },
    { label: "Using Sorry", value: "simple-sorry" },
    { label: "Weird Axioms", value: "simple-native" },
    { label: "Metaprogramming Exploit", value: "simple-exploit" },
    { label: "Challenge Success", value: "comp-correct" },
    { label: "Challenge With Weird Axioms", value: "comp-axioms" },
    { label: "Challenge/Solution Mismatch", value: "comp-mismatch" },
    { label: "Using Sorry (Challenge)", value: "comp-sorry" },
    { label: "Metaprogramming Exploit (Challenge)", value: "comp-exploit" },
  ],
});

const defaultOption: EditorState = { type: "simple", code: "/- No code to speak of -/" };

const designDocLink = `https://versobox.live.lean-lang.org/#codez=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&tab=versobox`;

export default function App() {
  const [value, setValue] = useState<string[]>([]);
  const [status, setStatus] = useState<"waiting" | "checked" | "warning" | "error">("waiting");

  const state: EditorState = value[0] ? fakedata[value[0]] : defaultOption;

  let icon: JSX.Element;
  switch (status) {
    case "waiting":
      icon = <FontAwesomeIcon icon={faCircle} style={{ color: "goldenrod" }} />;
      break;
    case "checked":
      icon = <FontAwesomeIcon icon={faCheckDouble} style={{ color: "darkblue" }} />;
      break;
    case "warning":
      icon = <FontAwesomeIcon icon={faWarning} style={{ color: "goldenrod" }} />;
      break;
    case "error":
      icon = <FontAwesomeIcon icon={faSquareXmark} style={{ color: "darkred" }} />;
      break;
  }

  const [currTab, setCurrTab] = useState<null | string>(null);
  const [aPerc, setAPerc] = useState(50);
  const [bPerc, setBPerc] = useState(50);
  const splitterPanelB = useRef<HTMLDivElement | null>(null);
  const splitterTabs = useRef<HTMLDivElement | null>(null);
  const splitterConfig = useRef<HTMLDivElement | null>(null);
  const [scrollHMenu, setScrollHMenu] = useState(0);

  useEffect(() => {
    if (currTab !== "verify") return undefined;
    const observer = new ResizeObserver(() => {
      setScrollHMenu(
        splitterPanelB.current!.offsetHeight -
          splitterConfig.current!.offsetHeight -
          splitterTabs.current!.offsetHeight,
      );
    });
    setScrollHMenu(
      splitterPanelB.current!.offsetHeight -
        splitterConfig.current!.offsetHeight -
        splitterTabs.current!.offsetHeight,
    );
    observer.observe(splitterPanelB.current!);

    return () => {
      observer.disconnect();
    };
  }, [currTab]);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto auto 1fr",
          height: "100vh",
        }}
      >
        <Text style={{ marginBottom: 2 }}>
          This is a prototype for adding verification functionality to the Live Lean app. You can
          pick specific inputs from the drop-down below. See{" "}
          <Link href={designDocLink} target="_blank">
            the design document
          </Link>{" "}
          for context and details.
        </Text>
        <Select.Root
          collection={options}
          value={value}
          onValueChange={(e) => setValue(e.value)}
          style={{ marginBottom: "1rem" }}
        >
          <Select.Label hidden={true}>Choose example</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select input" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {options.items.map((opt) => (
                  <Select.Item item={opt} key={opt.value}>
                    {opt.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        <Splitter.Root
          panels={[{ id: "a" }, { id: "b" }]}
          onResize={(e) => {
            setAPerc(e.size[0]);
            setBPerc(e.size[1]);
          }}
        >
          <Splitter.Panel id="a" display="grid">
            {state.type === "simple" ? (
              <SimpleEditor code={state.code} />
            ) : (
              <ComparatorEditor
                vw={aPerc - 1}
                challenge={state.challenge}
                solution={state.solution}
              />
            )}
          </Splitter.Panel>
          <Splitter.ResizeTrigger id="a:b" />{" "}
          <Splitter.Panel id="b" ref={splitterPanelB}>
            <Tabs.Root
              defaultValue="infoview"
              display="grid"
              gridTemplateRows="auto 1fr"
              onValueChange={(e) => setCurrTab(e.value)}
            >
              <Tabs.List ref={splitterTabs}>
                <Tabs.Trigger value="infoview">InfoView</Tabs.Trigger>
                <Tabs.Trigger value="verify">Verification {icon}</Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
              <Tabs.Content value="infoview" display="grid">
                <Stack style={{ paddingInline: "var(--chakra-spacing-3)" }}>
                  <Text>This demo doesn't actually have an infoview!</Text>
                  <Text>
                    This is here in the demo to illustrate that most of the time, the verification
                    signal will just come from the icon on the "Verification" tab, but that people
                    can click on the verification tab for more info.
                  </Text>
                  <Text>
                    In normal usage, people are <Em>mostly</Em> gonna be here, looking at this here
                    infoview.
                  </Text>
                </Stack>
              </Tabs.Content>
              <Tabs.Content value="verify" display="grid" paddingTop="0">
                <Stack
                  backgroundColor="lightgray"
                  direction="row"
                  paddingInline="var(--chakra-spacing-3)"
                  paddingBlock="var(--chakra-spacing-1)"
                  ref={splitterConfig}
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() =>
                      alert(
                        "In the final version this will be off by default but can be turned on. In this demo it's always on.",
                      )
                    }
                  />

                  <Text textStyle="xs">
                    Use Nanoda (
                    <Link
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(
                          "This will go to a webpage explaining how verification works, the section that explains what independent kernels are, that Nanoda is one, and that this button additional invokes Nanoda checking",
                        );
                      }}
                    >
                      what?
                    </Link>
                    )
                  </Text>
                  <Text textStyle="xs" marginLeft="auto">
                    <Link
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(
                          "This is where we link to a general-audience explanation of what it means for Lean's kernel to check a mathematical development.",
                        );
                      }}
                    >
                      What is verification?
                    </Link>
                  </Text>
                </Stack>
                <ScrollArea.Root height={scrollHMenu}>
                  <ScrollArea.Viewport>
                    <ScrollArea.Content paddingBlock="var(--chakra-spacing-2)">
                      <VerifyTab vw={bPerc - 1} state={state} setStatus={setStatus} />
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar orientation="vertical" />
                  <ScrollArea.Corner />
                </ScrollArea.Root>
              </Tabs.Content>
            </Tabs.Root>
          </Splitter.Panel>
        </Splitter.Root>
      </div>
    </>
  );
}
