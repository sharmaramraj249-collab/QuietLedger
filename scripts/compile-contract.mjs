import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
if (process.platform === "win32") {
  throw new Error("Compact has no native Windows compiler. Run contract:compile in WSL, Linux, or the Netlify build.");
}
mkdirSync("contracts/managed", { recursive: true });
const result = spawnSync("compact", ["compile", "+0.31.1", "contracts/quiet-ledger.compact", "contracts/managed"], { stdio: "inherit" });
if (result.error || result.status !== 0) {
  throw new Error("Compact 0.31.1 was not available or rejected the contract. Install the official devtools, run `compact update 0.31.1`, then retry.");
}
