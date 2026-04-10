import type { RegisterRequest, VerificationResponse } from "./types.ts";

const STANDARD_CHALLENGE = `importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=bysorry`;

export async function doWork(data: RegisterRequest): Promise<VerificationResponse> {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 2000));
  if (data.type === "simple") {
    const code = data.code
      .split("\n")
      .join("")
      .split(" ")
      .map((x) => x.trim())
      .join("");
    console.log({ code });
    if (code === "/-Nocodetospeakof-/") {
      return { type: "empty" };
    }
    if (
      code.startsWith(
        "importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=byrepeat",
      )
    ) {
      return {
        type: "full",
        signature: [
          `def pluss (a._@._internal._hyg.0 n : Nat) : Nat :=
  HAdd.hAdd (HAdd.hAdd a._@._internal._hyg.0 n)
    (HAdd.hAdd (HAdd.hAdd (OfNat.ofNat 1) (OfNat.ofNat 999)) (OfNat.ofNat 2))`,
          "theorem pluss_comm : forall {a b : Nat}, Eq (pluss a b) (pluss b a) := _",
        ],
      };
    }
    if (
      code.startsWith(
        "importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=bysorry",
      )
    ) {
      return { type: "sorry", where: "pluss_comm" };
    }
    if (
      code.startsWith(
        "importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=byhave",
      )
    ) {
      return {
        type: "partial",
        axioms: [
          `axiom pluss_comm._native.native_decide.ax_1_1 :
  Eq
    (Decidable.decide (Eq (HAdd.hAdd (HAdd.hAdd (OfNat.ofNat 1) (OfNat.ofNat 999)) (OfNat.ofNat 2)) (OfNat.ofNat 1002)))
    Bool.true`,
        ],
        signature: [
          `def pluss (a._@._internal._hyg.0 n : Nat) : Nat :=
  HAdd.hAdd (HAdd.hAdd a._@._internal._hyg.0 n)
    (HAdd.hAdd (HAdd.hAdd (OfNat.ofNat 1) (OfNat.ofNat 999)) (OfNat.ofNat 2))`,
          `theorem pluss_comm : forall {a b : Nat}, Eq (pluss a b) (pluss b a) := _`,
        ],
      };
    }
    if (code.startsWith("importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)elab")) {
      return {
        type: "full",
        signature: [
          `def pluss (a._@._internal._hyg.0 n : Nat) : Nat :=
  HAdd.hAdd (HAdd.hAdd a._@._internal._hyg.0 n)
    (HAdd.hAdd (HAdd.hAdd (OfNat.ofNat 1) (OfNat.ofNat 999)) (OfNat.ofNat 2))`,
          `def pluss_comm : True := _`,
        ],
      };
    }
    return { type: "failure", text: "blah blah blah" };
  } else {
    const challenge = data.challenge
      .split("\n")
      .join("")
      .split(" ")
      .map((x) => x.trim())
      .join("");
    const solution = data.solution
      .split("\n")
      .join("")
      .split(" ")
      .map((x) => x.trim())
      .join("");
    console.log({ challenge, solution });
    if (challenge !== STANDARD_CHALLENGE) {
      return {
        type: "challenge_fail_mismatch",
        const: "pluss",
        what: "constant",
      };
    }

    if (solution.startsWith("importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)elab")) {
      return {
        type: "challenge_fail_mismatch",
        const: "pluss_comm",
        what: "theorem statement",
      };
    }

    if (
      solution.startsWith(
        "importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=byrepeat",
      )
    ) {
      return {
        type: "full",
        signature: [
          `def pluss (a._@._internal._hyg.0 n : Nat) : Nat :=
  HAdd.hAdd (HAdd.hAdd a._@._internal._hyg.0 n)
    (HAdd.hAdd (HAdd.hAdd (OfNat.ofNat 1) (OfNat.ofNat 999)) (OfNat.ofNat 2))`,
          "theorem pluss_comm : forall {a b : Nat}, Eq (pluss a b) (pluss b a) := _",
        ],
      };
    }
    if (
      solution.startsWith(
        `importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=bysorry`,
      )
    ) {
      return { type: "sorry", where: "pluss_comm" };
    }
    if (
      solution.startsWith(
        `importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=byhave`,
      )
    ) {
      return {
        type: "partial",
        axioms: [
          `axiom pluss_comm._native.native_decide.ax_1_1 :
  Eq
    (Decidable.decide (Eq (HAdd.hAdd (HAdd.hAdd (OfNat.ofNat 1) (OfNat.ofNat 999)) (OfNat.ofNat 2)) (OfNat.ofNat 1002)))
    Bool.true`,
        ],
        signature: ["theorem x : True := _"],
      };
    }
    return { type: "failure", text: "blah blah blah" };
  }
}
