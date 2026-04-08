import type { RegisterRequest, VerificationResponse } from "./types.ts";

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
    if (code === "theoremex:True:=True.intro") {
      return {
        type: "full",
        signature: ["theorem ex : True := _"],
      };
    }
    if (code === "theoremex:True:=bysorry") {
      return { type: "sorry", where: "ex" };
    }
    if (code === "theoremex:True:=bynative_decide") {
      return {
        type: "partial",
        axioms: ["ex._native.native_decide.ax_1 : decide True = true"],
        signature: ["theorem x : True := _"],
      };
    }
    if (code.startsWith("importLeanelab")) {
      return { type: "full", signature: ["theorem x : True := _"] };
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
    if (challenge === "theoremex:True:=bysorry" && solution === "theoremex:True:=True.intro") {
      return { type: "full", signature: ["theorem x : True := _"] };
    }
    if (challenge === "theoremex:True:=bysorry" && solution === "theoremex:True:=bysorry") {
      return { type: "sorry" };
    }
    if (challenge === "theoremex:True:=bysorry" && solution === "theoremex:True:=bynative_decide") {
      return {
        type: "partial",
        axioms: ["ex._native.native_decide.ax_1 : decide True = true"],
        signature: ["theorem x : True := _"],
      };
    }
    if (challenge === "theoremex:True:=bysorry" && solution === "importLeanelab") {
      return { type: "full", signature: ["theorem x : True := _"] };
    }
    if (
      (challenge === "theoremex:False:=bysorry" && solution.startsWith("importLeanelab")) ||
      solution === "theoremex:True:=True.intro"
    ) {
      return {
        type: "failure",
        text: "type of `ex` in challenge did not match type of `ex` in solution",
      };
    }
    return { type: "failure", text: "blah blah blah" };
  }
}
