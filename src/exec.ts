/* eslint-disable @typescript-eslint/naming-convention */
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { z } from "zod";

const IS_DEV = process.env.NODE_ENV === "development";
const PROJ_ROOT = resolve(process.env.PROJ_ROOT || "Projects");
export const OUTPUT_ROOT_DIR = await mkdtemp(join(tmpdir(), "verification-workflow-"));
const NANODA_DIR = process.env.NANODA_DIR || "/Users/rob/r/nanoda_lib/target/release";
const LEAN4EXPORT_BIN =
  process.env.LEAN4EXPORT_BIN || "/Users/rob/r/lean4export/.lake/build/bin/lean4export";
export const STANDARD_AXIOMS = ["propext", "Quot.sound", "Classical.choice"];

function callScript(cwd: string, script: string, args: string[]) {
  const sh = join(import.meta.dirname, "..", "..", "exec", script + ".sh");
  console.log(`Calling '${sh}' with args ${JSON.stringify(args)}`);
  return spawn(sh, args, { cwd });
}

/**
 * Generates (and returns) a unique project directory `projectId` and a
 * `process` that will, upon successful termination, place the `olean` files
 * for `$projectId/olean`
 */
export async function createOlean(
  projectName: string,
  leanModuleName: string,
  leanFileContents: string,
) {
  const projDir = join(PROJ_ROOT, projectName);
  const projectId = randomUUID();
  const oleanDir = join(OUTPUT_ROOT_DIR, projectId, "olean");
  await mkdir(oleanDir, { recursive: true });

  if (IS_DEV) {
    console.log("DEVELOPMENT WARNING: running lake without bubblewrap!");
    await writeFile(join(projDir, leanModuleName + ".lean"), leanFileContents);
    await rm(join(projDir, ".lake", "build"), { recursive: true, force: true });
    await mkdir(join(oleanDir, ".lake", "build"), { recursive: true });
    await symlink(oleanDir, join(projDir, ".lake", "build"));
    return {
      projectId: projectId,
      process: spawn("lake", ["build", leanModuleName], { cwd: projDir }),
    };
  } else {
    await writeFile(join(oleanDir, leanModuleName + ".lean"), leanFileContents);
    const workDir = join(OUTPUT_ROOT_DIR, projectId, "workdir");
    await mkdir(workDir);
    return {
      projectId: projectId,
      process: callScript(projDir, "createOlean", [oleanDir, workDir, leanModuleName]),
    };
  }
}

/**
 * Zod description of the JSON value printed out by a successful run of
 * `readAllConsts`
 */
export const zModuleConstantResponse = z.union([
  z.object({ type: z.literal("failure"), text: z.string() }),
  z.object({ type: z.literal("empty") }),
  z.object({
    type: z.literal("success"),
    axioms: z.array(z.string()),
    constants: z.array(z.string()),
    sorryThms: z.array(z.string()),
  }),
]);

/**
 * Reads the olean files from `$projectId/olean` and returns a process that,
 * upon successful termination, prints to standard output a JSON object
 * conforming to `zModuleConstantResponse`.
 */
export function readModuleConstants(
  projectName: string,
  leanModuleName: string,
  projectId: string,
) {
  const projDir = join(PROJ_ROOT, projectName);
  const oleanDir = join(OUTPUT_ROOT_DIR, projectId, "olean");

  if (IS_DEV) {
    // Dev only works with CONCURRENCY=1, so assume the correct olean files
    // are already in place as a result of calling `createOlean()`
    return spawn("lake", ["exe", "module-constants", leanModuleName], { cwd: projDir });
  } else {
    return callScript(projDir, "readModuleConstants", [oleanDir, leanModuleName]);
  }
}

export function leanExport(
  projectName: string,
  leanModuleName: string,
  projectId: string,
  constants: string[],
) {
  const projDir = join(PROJ_ROOT, projectName);
  const oleanDir = join(OUTPUT_ROOT_DIR, projectId, "olean");

  if (IS_DEV) {
    return spawn(
      "lake",
      ["exe", "lean4export", leanModuleName, "--", ...STANDARD_AXIOMS, ...constants],
      { cwd: projDir },
    );
  } else {
    return callScript(projDir, "leanExport", [
      LEAN4EXPORT_BIN,
      oleanDir,
      leanModuleName,
      ...STANDARD_AXIOMS,
      ...constants,
    ]);
  }
}

export async function nanoda(
  projectName: string,
  projectId: string,
  constants: string[],
  axioms: string[],
) {
  const nanodaConfig = join(OUTPUT_ROOT_DIR, projectId, "config.json");
  await writeFile(
    nanodaConfig,
    JSON.stringify(
      {
        use_stdin: true,
        nat_extension: true,
        string_extension: true,
        unpermitted_axiom_hard_error: false,
        num_threads: 1,
        pp_declars: constants.reverse(),
        pp_to_stdout: true,
        permitted_axioms: [...STANDARD_AXIOMS, ...axioms],
        pp_options: { width: 70 },
      },
      undefined,
      2,
    ),
  );

  // We're trusting `nanoda_bin` with non-sandboxed execution
  return spawn("nanoda_bin", [nanodaConfig], { env: { ...process.env, PATH: NANODA_DIR } });
}
