import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
mkdirSync("contracts/managed", { recursive: true });
const result = spawnSync("compact", ["compile", "+0.31.1", "contracts/quiet-ledger.compact", "contracts/managed"], { stdio: "inherit", shell: process.platform === "win32" });
if (result.error || result.status !== 0) {
  throw new Error("Compact 0.31.1 was not available or rejected the contract. Install the official devtools, run `compact update 0.31.1`, then retry.");
}
