import { useState } from "react";
import { usePasswordContext } from "./PasswordContext.ts";
import { getTranscript } from "./service.ts";

interface LookupTranscriptProps {
  visible: boolean;
}
export default function LookupTranscript({ visible }: LookupTranscriptProps) {
  const [feedback, setFeedback] = useState<
    | null
    | { error: string }
    | { success: false }
    | {
        success: true;
        transcript: {
          student: { studentID: number; studentName: string };
          grades: { course: string; grade: number }[];
        };
      }
  >(null);
  const [studentID, setStudentID] = useState("");
  const password = usePasswordContext();

  if (!visible) return null;
  return (
    <>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          getTranscript(password, studentID)
            .then((res) => setFeedback(res))
            .catch((err) => setFeedback({ error: `${err}` }));
        }}
      >
        <label htmlFor="idToView">Enter student id to view:</label>
        <input
          id="idToView"
          value={studentID}
          onChange={(ev) => {
            setFeedback(null);
            setStudentID(ev.target.value);
          }}
        />
        <br />
        <button>View</button>
      </form>
      <div className="feedback">
        {feedback &&
          ("error" in feedback ? (
            `${feedback.error}`
          ) : !feedback.success ? (
            `No student exists with id ${studentID}`
          ) : (
            <>
              {`Transcript for student ${feedback.transcript.student.studentName} (id ${feedback.transcript.student.studentID})`}
              <ul>
                {feedback.transcript.grades.map(({ course, grade }, ndx) => (
                  <li key={ndx}>{`${grade} in ${course}`}</li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </>
  );
}
