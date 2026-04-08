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
    hash: `26d0a4c1f5ec2f43375ae2cb95c96a08964c308dfceeec6e9c155bf57ad5b6ce`,
    friendlyHash: "red-frightened-koala",
  },
  "comp-axioms": {
    type: "comparator",
    challenge: `theorem ex : True :=\n  by sorry`,
    solution: `theorem ex : True :=\n  by native_decide`,
    hash: `26d0a4c1f5ec2f43375ae2cb95c96a08964c308dfceeec6e9c155bf57ad5b6ce`,
    friendlyHash: "red-frightened-koala",
  },
  "comp-exploit": {
    type: "comparator",
    challenge: `theorem ex : False :=\n  by sorry`,
    solution: exploit,
    hash: `ec81ccbfef947d21b672be36536a20cdfbfe2bced89ab58a8ae1351d24021bbc`,
    friendlyHash: "tired-enlightened-microbe",
  },
  "comp-mismatch": {
    type: "comparator",
    challenge: `theorem ex : False :=\n  by sorry`,
    solution: `theorem ex : True :=\n  True.intro`,
    hash: `ec81ccbfef947d21b672be36536a20cdfbfe2bced89ab58a8ae1351d24021bbc`,
    friendlyHash: "tired-enlightened-microbe",
  },
  "comp-sorry": {
    type: "comparator",
    challenge: `theorem ex : False :=\n  by sorry`,
    solution: `theorem ex : False :=\n  by sorry`,
    hash: `ec81ccbfef947d21b672be36536a20cdfbfe2bced89ab58a8ae1351d24021bbc`,
    friendlyHash: "tired-enlightened-microbe",
  },
};
