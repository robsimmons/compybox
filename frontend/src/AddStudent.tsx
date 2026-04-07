import { useState } from "react";
import { addStudent } from "./service.ts";
import { usePasswordContext } from "./PasswordContext.ts";

interface AddStudentProps {
  visible: boolean;
}

export default function AddStudent({ visible }: AddStudentProps) {
  const [feedback, setFeedback] = useState<null | string>(null);
  const [name, setName] = useState<string>("");
  const password = usePasswordContext();

  if (!visible) return null;
  return (
    <>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          addStudent(password, name)
            .then((res) =>
              setFeedback(`Record created for student '${name}' with ID ${res.studentID}`),
            )
            .catch((err) => setFeedback(`${err}`));
        }}
      >
        <label htmlFor="studentName">Enter new student's name:</label>
        <input
          id="studentName"
          value={name}
          onChange={(ev) => {
            setFeedback(null);
            setName(ev.target.value);
          }}
        />
        <br />
        <button>Create new student transcript</button>
      </form>
      <div className="feedback">{feedback}</div>
    </>
  );
}
