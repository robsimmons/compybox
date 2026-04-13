import express from "express";
import { addWorkToQueue, emitStatusNow, emitter, isJob, type EventPayload } from "./dispatch.ts";
import { zRegisterRequest } from "./types.ts";

export const app = express();
app.use(express.json());

app.post("/compybox/api/register", (req, res) => {
  const body = zRegisterRequest.parse(req.body);
  const id = addWorkToQueue(body);
  res.send({ track: "compybox/api/track/" + id });
});

app.post("/compybox/api/sync", (req, res) => {
  const body = zRegisterRequest.parse(req.body);
  const id = addWorkToQueue(body);
  const handleUpdate = (...payload: EventPayload) => {
    if (payload[0] === "done") {
      res.send(payload[1]);
    } else if (payload[0] === "failed") {
      res.send({ type: "done", data: { type: "failure", text: payload[1].toString() } });
    }
  };

  res.on("close", () => {
    emitter.off(id, handleUpdate);
  });
  emitter.on(id, handleUpdate);
  emitStatusNow(id);
});

app.get("/compybox/api/track/:id", (req, res) => {
  const id = req.params.id;
  if (!isJob(id)) {
    res.status(400).send(`the server did not recognize the id ${id}`);
  }

  // Server-sent events always need these
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  // For nginx
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendMsg = (msg: string) => {
    res.write(`data: ${msg}\n\n`);
  };

  const keepAlive: NodeJS.Timeout | undefined = setInterval(() => {
    res.write(":\n");
  }, 5000);

  const handleUpdate = (...payload: EventPayload) => {
    switch (payload[0]) {
      case "done":
        clearInterval(keepAlive);
        emitter.removeAllListeners(id);
        sendMsg(JSON.stringify({ type: "done", data: payload[1] }));
        res.end();
        break;
      case "failed":
        clearInterval(keepAlive);
        emitter.removeAllListeners(id);
        sendMsg(JSON.stringify({ type: "error", data: payload[1].toString() }));
        res.end();
        break;
      case "running":
        sendMsg(JSON.stringify({ type: "running" }));
        break;
      case "stats":
        sendMsg(JSON.stringify({ type: "stats", waiting: payload[1], place: payload[2] }));
        break;
    }
  };

  res.on("close", () => {
    clearInterval(keepAlive);
    emitter.removeAllListeners(id);
  });
  emitter.on(id, handleUpdate);
  emitStatusNow(id);
});
