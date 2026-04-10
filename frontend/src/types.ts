export type EditorState =
  | { type: "simple"; code: string }
  | { type: "comparator"; challenge: string; solution: string };
