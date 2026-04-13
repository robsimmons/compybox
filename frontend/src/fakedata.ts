import type { EditorState } from "./types";

const exploit = `import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

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

theorem pluss_comm : {a b : ℕ} → pluss a b = pluss b a := 
  bogus ai generated nonsense`;

const challenge = `import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

theorem pluss_comm {a b} : pluss a b = pluss b a := by
  sorry`;

const basicSol = `import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

theorem pluss_comm {a b} : pluss a b = pluss b a := by
  repeat rw [pluss]
  rw [Nat.add_comm a b]`;

const nativeSol = `import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

theorem pluss_comm {a b} : pluss a b = pluss b a := by
  have h : 1 + 999 + 2 = 1002 := by native_decide
  repeat rw [pluss]
  repeat rw [h]
  rw [Nat.add_comm a b]`;

export const fakedata: { [key: string]: EditorState } = {
  "simple-correct": {
    type: "simple",
    code: basicSol,
  },
  "simple-err": { type: "simple", code: `theorem ex : True :=\n  by refl` },
  "simple-sorry": {
    type: "simple",
    code: challenge,
  },
  "simple-typo": {
    type: "simple",
    code: `import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

  theorem pluss_comm {a b} : pluss a b = pluss b a := by
  sorry

d`,
  },
  "simple-native": {
    type: "simple",
    code: nativeSol,
  },
  "simple-exploit": { type: "simple", code: exploit },
  "simple-exploit-module": {
    type: "simple",
    code: `module
public import Lean
import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (1 + 999 + 2)

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

theorem pluss_comm : {a b : ℕ} → pluss a b = pluss b a := 
  bogus ai generated nonsense\n`,
  },
  "comp-correct": {
    type: "comparator",
    challenge: challenge,
    solution: basicSol,
  },
  "comp-axioms": {
    type: "comparator",
    challenge: challenge,
    solution: nativeSol,
  },
  "comp-exploit": {
    type: "comparator",
    challenge: challenge,
    solution: exploit,
  },
  "comp-mismatch": {
    type: "comparator",
    challenge: `import Mathlib

def pluss (a b : ℕ) : ℕ := a + b + (2 + 999 + 1)

theorem pluss_comm {a b} : pluss a b = pluss b a := by
  sorry`,
    solution: basicSol,
  },
  "comp-sorry": {
    type: "comparator",
    challenge: challenge,
    solution: challenge,
  },
};
