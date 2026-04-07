import { useState } from "react";
import { addGrade } from "./service.ts";
import { usePasswordContext } from "./PasswordContext.ts";

interface AddGradeProps {
  visible: boolean;
}

export default function AddGrade({ visible }: AddGradeProps) {
  const [feedback, setFeedback] = useState<null | string>(null);
  const [studentID, setStudentID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseGrade, setCourseGrade] = useState("");
  const password = usePasswordContext();

  if (!visible) return null;
  return (
    <>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          addGrade(password, studentID, courseName, courseGrade)
            .then((res) =>
              setFeedback(`Added grade of ${courseGrade} in ${courseName} successfully`),
            )
            .catch((err) => setFeedback(`${err}`));
        }}
      >
        <label htmlFor="studentIdForAddGrade">Student ID:</label>
        <input
          id="studentIdForAddGrade"
          value={studentID}
          onChange={(ev) => {
            setFeedback(null);
            setStudentID(ev.target.value);
          }}
        />
        <br />
        <label htmlFor="addGradeCourse">Course name:</label>
        <input
          id="addGradeCourse"
          value={courseName}
          onChange={(ev) => {
            setFeedback(null);
            setCourseName(ev.target.value);
          }}
        />
        <br />
        <label htmlFor="addGradeGrade">Course grade:</label>
        <input
          id="addGradeGrade"
          value={courseGrade}
          onChange={(ev) => {
            setFeedback(null);
            setCourseGrade(ev.target.value);
          }}
        />
        <br />
        <button>Add grade</button>
      </form>
      <div className="feedback">{feedback}</div>
    </>
  );
}
