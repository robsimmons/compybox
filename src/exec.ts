import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fork, spawn } from "node:child_process";

const IS_DEV = process.env.NODE_ENV === "development";
const PROJ_ROOT = process.env.PROJ_ROOT || "Projects";
export const OUTPUT_ROOT_DIR = await mkdtemp(join(tmpdir(), "verso-output-"));

export async function createOlean(
  projectName: string,
  leanModuleName: string,
  leanFileContents: string,
) {
  const outputDirName = randomUUID();
  const outputDir = join(OUTPUT_ROOT_DIR, outputDirName);
  await mkdir(outputDir);

  const projDir = join(PROJ_ROOT, projectName);
  if (IS_DEV) {
    console.log("DEVELOPMENT WARNING: running lake without bubblewrap!");
    /*
    try {
      await rm(join(projDir, ".lake", "build"), {
        recursive: true,
        force: true,
      });
    } catch (e) {
      / ignore /
    } */
    await writeFile(join(projDir, leanModuleName + ".lean"), leanFileContents);
    return {
      dir: outputDirName,
      process: spawn("lake", ["build", leanModuleName], { cwd: projDir }),
    };
  } else {
    throw new Error("unimplemented");
  }
}

export function readAllConsts(projectName: string, leanModuleName: string, projectId: string) {
  const projDir = join(PROJ_ROOT, projectName);

  if (IS_DEV) {
    return spawn("lake", ["exe", "read-all-consts", leanModuleName], { cwd: projDir });
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
      [
        "exe",
        "lean4export",
        leanModuleName,
        "--",
        "propext",
        "Quot.sound",
        "Classical.choice",
        ...constants,
      ],
      { cwd: projDir },
    );
  } else {
    throw new Error("unimplemented");
  }
}

export function nanoda(
  projectName: string,
  leanModuleName: string,
  projectId: string,
  constants: [],
) {}
