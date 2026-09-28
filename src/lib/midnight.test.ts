import { describe, expect, it } from "vitest";
import { callSubmitSignalCircuit, findSubmittedTransaction, waitForSubmittedTransaction } from "./midnight";
describe("circuit boundary", () => {
  it("never fabricates a transaction ID without a deployed contract", async () => {
    await expect(callSubmitSignalCircuit(
      { getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }) },
      { network: "preprod", windowId: "2026-04", category: 2, credentialSecret: "private" },
      { contractAddress: "", artifactUrl: "/contract/index.js" },
    )).rejects.toThrow(/not deployed/);
  });

  it("finds only the newly submitted wallet transaction", () => {
    const history = [
      { txHash: "new-hash", txStatus: { status: "pending" as const } },
      { txHash: "old-hash", txStatus: { status: "finalized" as const } },
    ];
    expect(findSubmittedTransaction(history, new Set(["old-hash"]))).toEqual(history[0]);
  });

  it("waits for 1AM to report a real finalized hash", async () => {
    let read = 0;
    const entry = await waitForSubmittedTransaction({
      getConnectionStatus: async () => ({ status: "connected", networkId: "preview" }),
      getTxHistory: async () => {
        read += 1;
        return [{ txHash: "wallet-hash", txStatus: { status: read > 1 ? "finalized" : "pending" } }];
      },
    }, new Set(), undefined, 2, 0);
    expect(entry).toMatchObject({ txHash: "wallet-hash", txStatus: { status: "finalized" } });
  });
});
