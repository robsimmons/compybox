

export type EditorState =
  | { type: "simple"; code: string }
  | { type: "comparator"; challenge: string; hash: string; friendlyHash: string; solution: string };
