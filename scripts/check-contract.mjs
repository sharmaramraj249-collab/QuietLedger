import { existsSync, readFileSync } from "node:fs";
const source = readFileSync("contracts/quiet-ledger.compact", "utf8");
const requirements = ["export ledger eligibleCommitments", "export ledger usedNullifiers", "witness nullifierSecret", "circuit credentialFor", "eligibleCommitments.insert(disclose(credentialFor(nullifierSecret())))", "eligibleCommitments.member(credentialFor(nullifierSecret()))", "export circuit submitSignal", "usedNullifiers.insert(disclose(nullifier))", "signalCount.increment(1)"];
const missing = requirements.filter((requirement) => !source.includes(requirement));
if (missing.length) throw new Error(`Compact privacy boundary check failed: ${missing.join(", ")}`);
if (process.argv.includes("--artifacts") && !existsSync("contracts/managed/contract/index.js")) throw new Error("Generated artifacts are absent. Run npm run contract:compile with Compact 0.31.1 installed.");
console.log("Compact privacy boundary check passed.");
