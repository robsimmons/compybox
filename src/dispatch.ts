import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { Queue } from "./queue.ts";
import type { RegisterRequest, VerificationResponse } from "./types.ts";
import { doWork } from "./worker.ts";

const Q: Queue<string> = new Queue();
type JobStatus =
  | { tag: "waiting"; data: RegisterRequest }
  | { tag: "running" }
  | { tag: "failed"; error: Error }
  | { tag: "complete"; result: VerificationResponse };
const jobDb = new Map<string, { sequenceNumber: number; status: JobStatus }>();
let totalJobCount = 0;
let waitingJobCount = 0;
let runningJobCount = 0;

const CONCURRENCY = 1;
export type EventPayload =
  | [tag: "running"]
  | [tag: "done", result: VerificationResponse]
  | [tag: "error", error: Error]
  | [tag: "stats", waiting: number, place: number];
export const emitter = new EventEmitter<{ [id: string]: EventPayload }>();

export function isJob(id: string) {
  return !!jobDb.get(id);
}

export function emitStatusNow(id: string) {
  console.log("Emitting status now for " + id);
  const job = jobDb.get(id);
  if (!job) {
    console.log("ERROR: no job for " + id);
    return;
  }
  switch (job.status.tag) {
    case "waiting":
      emitter.emit(
        id,
        "stats",
        waitingJobCount,
        waitingJobCount - (totalJobCount - job.sequenceNumber),
      );
      break;
    case "complete":
      emitter.emit(id, "done", job.status.result);
      break;
    case "failed":
      emitter.emit(id, "failed", job.status.error);
      break;
    case "running":
      emitter.emit(id, "running");
  }
}

setInterval(() => {
  console.log({ waitingJobCount, totalJobCount, runningJobCount });
  [...Q].map(emitStatusNow);
}, 3000);

/** Immediately start job if there's an available worker */
function drain() {
  // An `if` statement would be fine here; the `while` loop is defensive but
  // harmless.
  while (runningJobCount < CONCURRENCY && Q.length > 0) {
    const id = Q.deq()!;
    const job = jobDb.get(id)!;
    // By invariant, job id is enqueued and is waiting
    if (job.status.tag !== "waiting") throw new Error("invariant, status was " + job.status.tag);
    const jobData = job.status.data;

    job.status = { tag: "running" };
    emitter.emit(id, "running");
    runningJobCount++;
    waitingJobCount--;

    doWork(jobData)
      .then((result) => {
        job.status = { tag: "complete", result };
        emitStatusNow(id);
      })
      .catch((error: Error) => {
        // Retry logic would go here
        job.status = { tag: "failed", error };
        emitStatusNow(id);
      })
      .finally(() => {
        runningJobCount--;
        drain();
      });
  }
}

/** Create a new work item for a particular project/code combination */
export function addWorkToQueue(data: RegisterRequest) {
  const id = randomUUID();
  Q.enq(id);
  waitingJobCount++;
  jobDb.set(id, { sequenceNumber: totalJobCount++, status: { tag: "waiting", data } });
  drain();
  return id;
}

export function stats() {
  return { waitingJobCount, totalJobCount, runningJobCount };
}
