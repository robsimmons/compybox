import { Textarea } from "@chakra-ui/react";

interface SimpleEditorProps {
  code: string;
}
export default function SimpleEditor({ code }: SimpleEditorProps) {
  return (
    <Textarea
      resize="none"
      readOnly
      value={code}
      style={{ fontFamily: "monospace", width: "100%", height: "100%" }}
    />
  );
}
