import { describe, expect, it } from "vitest";
import { callSubmitSignalCircuit } from "./midnight";
describe("circuit boundary", () => {
  it("never fabricates a transaction ID without a deployed contract", async () => {
    await expect(callSubmitSignalCircuit({ getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }) }, { network: "preprod", windowId: "2026-04", category: 2, credentialSecret: "private" })).rejects.toThrow(/not configured/);
  });
});
