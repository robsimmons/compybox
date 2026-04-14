import { z } from "zod";
import {
  createOlean,
  leanExport,
  nanoda,
  readModuleConstants,
  zModuleConstantResponse,
} from "./exec.ts";
import type { RegisterRequest, VerificationResponse } from "./types.ts";

const STANDARD_CHALLENGE = `importMathlibdefpluss(ab:ℕ):ℕ:=a+b+(1+999+2)theorempluss_comm{ab}:plussab=plussba:=bysorry`;

const StandardAxiomNameSet = new Set([
  "propext",
  "Quot.sound",
  "Classical.choice",
  "Quot.sound.{u}",
  "Classical.choice.{u}",
]);

export async function doWork(data: RegisterRequest): Promise<VerificationResponse> {
  if (data.type === "simple") {
    let stdout: string[] = [];
    let stderr: string[] = [];
    let combined: string[] = [];
    let finished = false;
    const pushData =
      (buffer: string[], src: string = "") =>
      (data: unknown) => {
        const newOutput = data instanceof Buffer ? data.toString("utf-8") : `${data}`;
        buffer.push(newOutput);
        combined.push(newOutput);
      };

    // First task: lake build TheLeanFile
    const { projectId, process: processOlean } = await createOlean(
      data.project,
      "TheLeanFile",
      data.code,
    );
    processOlean.stdout.on("data", pushData(stdout));
    processOlean.stderr.on("data", pushData(stderr));
    await new Promise((resolve, reject) => {
      processOlean.on("error", (data) => {
        finished = true;
        reject(new Error(`compilation to olean failed\n\n${combined.join("")}}`));
      });
      processOlean.on("close", (data) => {
        if (finished) return;
        resolve(null);
      });
    });
    if (processOlean.exitCode) {
      return {
        type: "failure",
        component: "Lean's attempt to create an olean file from the input",
        text: combined.join(""),
      };
    }

    // Second task: lake exe read-all-consts TheLeanFile
    finished = false;
    stdout = [];
    stderr = [];
    combined = [];
    const processReadAllConsts = readModuleConstants(data.project, "TheLeanFile", projectId);
    processReadAllConsts.stdout.on("data", pushData(stdout));
    processReadAllConsts.stderr.on("data", pushData(stderr));
    const readAllConstsExit = await new Promise((resolve, reject) => {
      processReadAllConsts.on("error", (data) => {
        finished = true;
        reject(new Error(`reading out constants failed\n\n${combined.join("")}`));
      });
      processReadAllConsts.on("close", () => {
        if (finished) return;
        resolve(processReadAllConsts.exitCode);
      });
    });
    if (readAllConstsExit) {
      return {
        type: "failure",
        component: "Reading the constants out from the generated olean",
        text: combined.join(""),
      };
    }
    const moduleConstants = zModuleConstantResponse.parse(JSON.parse(stdout.join("")));
    if (moduleConstants.type === "failure") {
      return {
        type: "failure",
        component: "Reading the constants out from the generated olean",
        text: moduleConstants.text,
      };
    }
    if (moduleConstants.type === "empty") {
      return { type: "empty" };
    }
    if (moduleConstants.sorryThms.length > 0) {
      return { type: "sorry", where: moduleConstants.sorryThms };
    }

    // Third task: pipe from lean4export into nanoda
    finished = false;
    stdout = [];
    stderr = [];
    combined = [];
    const processLeanExport = leanExport(
      data.project,
      "TheLeanFile",
      projectId,
      moduleConstants.constants,
      moduleConstants.axioms,
    );
    const processNanoda = await nanoda(
      data.project,
      projectId,
      moduleConstants.constants,
      moduleConstants.axioms,
    );
    processLeanExport.stdout.on("data", (data) => processNanoda.stdin.write(data));
    processLeanExport.stderr.on("data", pushData(stderr, "lee"));
    processNanoda.stdout.on("data", pushData(stdout, "nao"));
    processNanoda.stderr.on("data", pushData(stderr, "nae"));
    processLeanExport.on("close", () => processNanoda.stdin.end());
    await new Promise((resolve, reject) => {
      processNanoda.on("error", (data) => {
        finished = true;
        reject(new Error(`nanoda failed\n\n${combined.join("")}}`));
      });
      processNanoda.on("close", (data) => {
        if (finished) return;
        resolve(null);
      });
    });
    if (processLeanExport.exitCode || processNanoda.exitCode) {
      return {
        type: "failure",
        component: "Exporting and checking with Nanoda",
        text: `${combined.join("")}`,
      };
    }

    // const processLeanExport = leanExport(data.project, "TheLeanFile");
    const components = stdout.join("").trim().split("\n\n");
    const allAxioms = components.filter(
      (axiom) => axiom.startsWith("axiom") && !StandardAxiomNameSet.has(axiom.split(" ")[1]),
    );
    const allOtherComponents = components.filter((axiom) => !axiom.startsWith("axiom"));
    for (const axiom of allAxioms) {
      if (!new Set(moduleConstants.axioms).has(axiom.split(" ")[1])) {
        return {
          type: "failure",
          component: "Exporting and checking with Nanoda",
          text: `Nanoda reported an unexpected use of the axiom ${axiom.split(" ")[1]}`,
        };
      }
    }

    if (moduleConstants.axioms.length > 0) {
      return { type: "partial", signature: allOtherComponents, axioms: allAxioms };
    }
    return { type: "full", signature: allOtherComponents };
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
      return { type: "sorry", where: ["pluss_comm"] };
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
    throw new Error("unimplemented");
  }
}
