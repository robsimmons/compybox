import { useState } from "react";
import AddStudent from "./AddStudent.tsx";
import AddGrade from "./AddGrade.tsx";
import LookupTranscript from "./LookupTranscript.tsx";

interface TabInfo {
  key: string;
  display: string;
}

const TRANSCRIPT_TABS: TabInfo[] = [
  { key: "new-student", display: "Add Student" },
  { key: "new-grade", display: "Add Grade" },
  { key: "view", display: "View Transcript" },
];

export default function TranscriptTabs() {
  const [currentTab, setCurrentTab] = useState(TRANSCRIPT_TABS[0].key);

  return (
    <div style={{ marginTop: "1em" }}>
      <div style={{ display: "flex", flexDirection: "row", width: "auto" }}>
        {TRANSCRIPT_TABS.map(({ key, display }) => (
          <button
            style={{
              border: "2px solid lightgray",
              borderBottom: 0,
              backgroundColor: currentTab === key ? "white" : "lightgray",
              color: "black",
              padding: "1em",
            }}
            key={key}
            disabled={currentTab === key}
            onClick={() => setCurrentTab(key)}
          >
            {display}
          </button>
        ))}
        <div
          style={{ display: "inline-block", borderBottom: "2px solid lightgray", flexGrow: 1 }}
        />
      </div>
      <div style={{ width: "auto", border: "2px solid lightgray", borderTop: 0, padding: "1em" }}>
        <AddStudent visible={currentTab === "new-student"} />
        <AddGrade visible={currentTab === "new-grade"} />
        <LookupTranscript visible={currentTab === "view"} />
      </div>
    </div>
  );
}
