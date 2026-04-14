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
  "simple-redefine-propext": {
    type: "simple",
    code: `-- Wojciech's fav, as edited by Mac 
module
import Lean
import all Lean.Environment

/- Redefine \`propext : False\`. -/
open Lean Elab Meta in
#eval modifyEnv (m := MetaM) fun env =>
  let base :=
    {env.base with
      private.constants.map₁ := env.base.private.constants.map₁.insert \`\`propext (.axiomInfo {
        name := \`\`propext
        type := .const \`\`False []
        levelParams := []
        isUnsafe := false
      })
    }
  {env with base, checked := Task.pure base.private}

public theorem efsq : ∀ (x y z n : Nat),
    0 < x → 0 < y → 0 < z → 2 < n →
    x^n + y^n ≠ z^n := by
  exfalso
  exact propext`,
  },
  "simple-plausible-native": {
    type: "simple",
    code: `-- Joachim's contribution #1
structure AType : Type 1 where
  data : Nat
  α : Type

-- these only differ in erased fields
def a : AType where data := 1; α := Unit
def b : AType := { a with α := Empty }

theorem thm (h : a = b) : False :=
  Empty.elim ((congrArg (f := (·.α)) h).mp Unit.unit)

def test : Bool := withPtrEq a b (fun _ => false) (fun h =>(thm h).elim)

theorem boom : False := Bool.noConfusion (show test = true by native_decide)`,
  },
  "simple-bad-nat": {
    type: "simple",
    code: `-- Heinrik's contribution
import Lean
open Lean

unsafe def badNatUnsafe : Nat := unsafeCast (-4294967296 : Int)

@[implemented_by badNatUnsafe] opaque badNatVal : Nat

run_elab
  addDecl <| .defnDecl {
    name        := .str .anonymous "badNat"
    levelParams := []
    type        := .const \`\`Nat []
    value       := .lit <| .natVal badNatVal
    hints       := .opaque
    safety      := .safe
  }

theorem falsy : False := by
  have truly_marvelous_0 : ¬badNat ≤ 9223372036854775807 := by decide
  have truly_marvelous_1 : ¬9223372036854775807 < badNat := by decide
  simp_all`,
  },
  "simple-malformed-expr": {
    type: "simple",
    code: `-- Joachim's contribution #2
import Lean

open Lean

#eval!
  do
    let e := mkStrLit (String.ofByteArray (.mk #[0xff]) sorry) -- or any other invalid utf8 in a string literal
    logInfo m!"{e}"
    addAndCompile <| .defnDecl {
      name := \`foo
      type := mkConst \`\`String
      value := e
      levelParams := []
      hints := .regular 0
      safety := .safe
    }

theorem boom1 : False := by
  -- decoding and encoding an invalid string is not roundtripping
  have : (foo = String.ofList foo.toList)    = false := by native_decide
  have : (foo = String.ofList foo.toList)    = true := by rw [String.ofList_toList]; simp
  contradiction`,
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
