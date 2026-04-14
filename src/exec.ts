/* eslint-disable @typescript-eslint/naming-convention */
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdir, mkdtemp, rm, rmdir, symlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fork, spawn } from "node:child_process";
import { write } from "node:fs";

const IS_DEV = process.env.NODE_ENV === "development";
const PROJ_ROOT = resolve(process.env.PROJ_ROOT || "Projects");
export const OUTPUT_ROOT_DIR = await mkdtemp(join(tmpdir(), "verification-workflow-"));
const NANODA_DIR = process.env.NANODA_DIR || "/Users/rob/r/nanoda_lib/target/release";
export const STANDARD_AXIOMS = ["propext", "Quot.sound", "Classical.choice"];

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
    await writeFile(join(projDir, leanModuleName + ".lean"), leanFileContents);
    await rm(join(projDir, ".lake", "build"), { recursive: true, force: true });
    await symlink(oleanDir, join(projDir, ".lake", "build"));
    return {
      projectId: projectId,
      process: spawn("lake", ["build", leanModuleName], { cwd: projDir }),
    };
  } else {
    throw new Error("unimplemented");
  }
}

export function readAllConsts(projectName: string, leanModuleName: string, projectId: string) {
  const projDir = join(PROJ_ROOT, projectName);

  if (IS_DEV) {
    // Dev only works with CONCURRENCY=1, so assume the correct olean files
    // are already in place as a result of calling `createOlean()`
    return spawn("lake", ["exe", "module-constants", leanModuleName], { cwd: projDir });
  } else {
    throw new Error("unimplemented");
  }
}

export function leanExport(
  projectName: string,
  leanModuleName: string,
  projectId: string,
  constants: string[],
  axioms: string[],
) {
  const projDir = join(PROJ_ROOT, projectName);

  if (IS_DEV) {
    return spawn(
      "lake",
      ["exe", "lean4export", leanModuleName, "--", ...STANDARD_AXIOMS, ...constants],
      { cwd: projDir },
    );
  } else {
    throw new Error("unimplemented");
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

  return spawn("nanoda_bin", [nanodaConfig], { env: { ...process.env, PATH: NANODA_DIR } });
}
