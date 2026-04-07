import express from "express";
import { addWorkToQueue, emitStatusNow, emitter, isJob, type EventPayload } from "./dispatch.ts";
import { zRegisterRequest } from "./types.ts";

export const app = express();
app.use(express.json());

app.post("/compybox/api/register", (req, res) => {
  const body = zRegisterRequest.parse(req.body);
  const id = addWorkToQueue(body);
  res.send("compybox/api/track/" + id);
});

app.post("/compybox/api/sync", (req, res) => {
  const body = zRegisterRequest.parse(req.body);
  const id = addWorkToQueue(body);
  const handleUpdate = (...payload: EventPayload) => {
    if (payload[0] === "done") {
      res.send(payload[1]);
    }
  };

  req.on("close", () => {
    emitter.off(id, handleUpdate);
  });
  emitter.on(id, handleUpdate);
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

  let keepAlive = setInterval(() => {
    res.write(":\n");
  }, 5000);

  const handleUpdate = (...payload: EventPayload) => {
    switch (payload[0]) {
      case "done":
        clearInterval(keepAlive);
        keepAlive = null;
        sendMsg("done " + JSON.stringify(payload[1]));
        res.end();
        break;
      case "error":
        clearInterval(keepAlive);
        keepAlive = null;
        sendMsg("error " + JSON.stringify(payload[1]));
        res.end();
        break;
      case "running":
        sendMsg("running " + id);
        break;
      case "stats":
        sendMsg("stats " + JSON.stringify({ waiting: payload[1], place: payload[2] }));
        break;
    }
  };

  req.on("close", () => {
    clearInterval(keepAlive);
    emitter.off(id, handleUpdate);
  });
  emitter.on(id, handleUpdate);
  emitStatusNow(id);
});
