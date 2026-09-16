import "dotenv/config";
import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    stdio: "inherit",
    env: process.env,
  }),
  spawn(process.execPath, ["--import", "tsx", "server/worker.ts"], {
    stdio: "inherit",
    env: process.env,
  }),
];
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
    process.exit();
  });

for (const child of children)
  child.on("exit", (code) => {
    if (code) {
      for (const sibling of children)
        if (sibling !== child) sibling.kill("SIGTERM");
      process.exitCode = code;
    }
  });
