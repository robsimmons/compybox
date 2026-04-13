import Lean
import Export

open Lean

def standardAxioms := #[``propext, ``Quot.sound, ``Classical.choice]

inductive VerificationResponse where
  | failure : String → VerificationResponse
  | empty : VerificationResponse
  | sorry : Array Name → VerificationResponse
  | contents : Array Name → Array Name → VerificationResponse
deriving Inhabited

instance : ToJson VerificationResponse where
  toJson
  | .failure str => Json.mkObj [ ("type", .str "failure"), ("stage", .str "initial processing"), ("text", .str str) ]
  | .empty => Json.mkObj [ ("type", .str "empty") ]
  | .sorry consts => Json.mkObj [ ("type", .str "sorry"), ("where", .arr (consts.map (.str ·.toString))) ]
  | .contents axioms consts => Json.mkObj [ ("type", .str "partial"), ("axioms", .arr (axioms.map (.str ·.toString))), ("constants", .arr (consts.map (.str ·.toString))) ]

/--
Given a module defined in an environment, analyze the module to determine its
relevant constants, and select an appropriate `VerificationResponse`.
-/
def readModule (env : Environment) (modName : Name) : StateM CollectAxioms.State VerificationResponse := do
  ReaderT.run (r := env) do -- Puts us in the CollectAxioms.M monad
  let some moduleIdx := env.getModuleIdx? modName
    | return .failure s!"Module `{modName}` not found"

  -- Grab all constants from the module
  let moduleData := env.header.moduleData[moduleIdx]!
  let constants := moduleData.constants
    |>.filterMap (fun const =>
      -- always include non-internal constants AND constants that are non-internal but private
      let constNameWithPrivateRemoved := const.name.components.filter (· != `_private)
      if not (constNameWithPrivateRemoved.any (·.isInternal)) then
        .some const
      -- omit internal constants that are partial or unsafe
      else if const.isPartial || const.isUnsafe then
        .none
      -- omit any internal theorems; include everything else
      -- (Q: are there other internal constants we want to omit?)
      else match const with
        | .thmInfo _ => .none
        | _ => .some const)

  -- Check for `empty` condition
  if constants.size = 0 then
    return .empty

  -- Collect all axioms used in the file's constants
  for const in constants do
    CollectAxioms.collect const.name
  let axiomsUsed := (← get).axioms

  -- Check for `sorry` condition: are there any theorems dependent on `sorryAx`
  if axiomsUsed.contains ``sorryAx then
    let sorryTheorems ← constants.filterM (fun const => do
      match const with
      | .thmInfo _ =>
        let (_, axState) := ((CollectAxioms.collect const.name).run env).run {}
        return axState.axioms.contains ``sorryAx
      | _ => return false)
    if sorryTheorems.size > 0 then
      return .sorry (sorryTheorems.map (·.name))

  -- Return the (non-standard) axioms and constants
  let nonStandardAxioms := axiomsUsed.filter (not <| standardAxioms.contains ·)
  return .contents nonStandardAxioms (constants.map (·.name))

def main (args : List String) : IO Unit := do
  try
    initSearchPath (← findSysroot)
    let .some modStr := args[0]?
      | throw <| IO.userError "Insufficient command-line arguments given"
    let modName := Name.mkStr1 modStr
    let envWithImport ← importModules #[Import.mk `Init true false false, Import.mk modName true false false] {}
    let (result, _) := (readModule envWithImport modName).run {}
    println! s!"{ToJson.toJson result |>.compress}"
  catch e =>
    println! s!"{ToJson.toJson (VerificationResponse.failure (ToString.toString e)) |>.compress}"
  return ()
