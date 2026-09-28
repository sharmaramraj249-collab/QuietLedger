import { cpSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";

const virtualContractId = "virtual:quiet-ledger-contract";
const resolvedVirtualContractId = `\0${virtualContractId}`;

const quietLedgerContract = () => ({
  name: "quiet-ledger-contract",
  resolveId(id: string) { return id === virtualContractId ? resolvedVirtualContractId : undefined; },
  load(id: string) {
    if (id !== resolvedVirtualContractId) return undefined;
    const generated = "contracts/managed/contract/index.js";
    return existsSync(generated)
      ? readFileSync(generated, "utf8")
      : "export const Contract = undefined;";
  },
});

const publishCompactArtifacts = () => ({
  name: "publish-compact-artifacts",
  closeBundle() {
    const source = "contracts/managed";
    if (!existsSync(`${source}/contract/index.js`)) return;
    cpSync(source, "dist/contracts/quiet-ledger", { recursive: true });
  },
});

export default defineConfig({
  resolve: {
    alias: {
      "isomorphic-ws": fileURLToPath(new URL("./src/lib/isomorphicWsBrowser.ts", import.meta.url)),
    },
  },
  plugins: [
    react(),
    nodePolyfills(),
    wasm(),
    quietLedgerContract(),
    publishCompactArtifacts(),
  ],
  build: { target: "esnext" },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] },
});
