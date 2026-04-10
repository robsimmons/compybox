import { z } from "zod";

export const zRegisterRequest = z.union([
  z.object({
    type: z.literal("simple"),
    project: z.string(),
    code: z.string(),
  }),
  z.object({
    type: z.literal("comparator"),
    project: z.string(),
    challenge: z.string(),
    solution: z.string(),
  }),
]);
export type RegisterRequest = z.infer<typeof zRegisterRequest>;

export type VerificationResponse =
  | { type: "failure"; text: string }
  | { type: "sorry"; where: string }
  | { type: "empty" }
  | { type: "partial"; axioms: string[]; signature: string[] }
  | { type: "challenge_fail_missing"; const: string; what: string; where: string }
  | { type: "challenge_fail_mismatch"; const: string; what: string; }
  | { type: "full"; signature: string[] };
