import type { EditorState } from "./types";

const exploit = `import Lean

elab "theorem " id:ident ":" _ty:term ":=" _pf:term : command =>
  Lean.Elab.Command.runTermElabM fun _ =>
    Lean.addAndCompile <| .defnDecl {
      name := id.getId
      levelParams := []
      type := Lean.mkConst \`\`True []
      value := Lean.mkConst \`\`True.intro []
      hints := .opaque
      safety := .safe
    }

theorem ex : False := bogus ai generated nonsense`;

export const fakedata: { [key: string]: EditorState } = {
  "simple-correct": { type: "simple", code: `theorem ex : True :=\n  True.intro` },
  "simple-err": { type: "simple", code: `theorem ex : True :=\n  by refl` },
  "simple-sorry": { type: "simple", code: `theorem ex : True :=\n  by sorry` },
  "simple-native": { type: "simple", code: `theorem ex : True :=\n  by native_decide` },
  "simple-exploit": { type: "simple", code: exploit },
  "comp-correct": {
    type: "comparator",
    challenge: `theorem ex : True :=\n  by sorry`,
    solution: `theorem ex : True :=\n  True.intro`,
  },
  "comp-axioms": {
    type: "comparator",
    challenge: `theorem ex : True :=\n  by sorry`,
    solution: `theorem ex : True :=\n  by native_decide`,
  },
  "comp-exploit": {
    type: "comparator",
    challenge: `theorem ex : False :=\n  by sorry`,
    solution: exploit,
  },
  "comp-mismatch": {
    type: "comparator",
    challenge: `theorem ex : False :=\n  by sorry`,
    solution: `theorem ex : True :=\n  True.intro`,
  },
  "comp-sorry": {
    type: "comparator",
    challenge: `theorem ex : False :=\n  by sorry`,
    solution: `theorem ex : False :=\n  by sorry`,
  },
};
