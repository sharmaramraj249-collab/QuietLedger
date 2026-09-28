import { cpSync, existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const publishCompactArtifacts = () => ({
  name: "publish-compact-artifacts",
  closeBundle() {
    const source = "contracts/managed";
    const registry = JSON.parse(readFileSync("public/quiet-ledger.config.json", "utf8")) as {
      networks?: Record<string, { contractAddress?: string }>;
    };
    const hasDeployment = Object.values(registry.networks ?? {}).some((item) => item.contractAddress?.trim());
    if (!existsSync(`${source}/contract/index.js`)) {
      if (hasDeployment) throw new Error("A contract address is configured, but generated Compact artifacts are missing. Run npm run contract:compile.");
      return;
    }
    cpSync(source, "dist/contracts/quiet-ledger", { recursive: true });
  },
});

export default defineConfig({
  plugins: [react(), publishCompactArtifacts()],
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] },
});
