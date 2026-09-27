import { describe, expect, it } from "vitest";
import { connectWallet, selectPreferredWallet, walletErrorMessage } from "./wallet";

const wallet = { name: "Other", apiVersion: "4.0.1", connect: async () => ({ getConnectionStatus: async () => ({ status: "connected" as const, networkId: "preprod" }), getUnshieldedAddress: async () => ({ unshieldedAddress: "addr" }) }) };
describe("wallet discovery", () => {
  it("prefers 1AM from UUID-keyed providers", () => expect(selectPreferredWallet([wallet, { ...wallet, name: "1AM", rdns: "io.1am" }]).name).toBe("1AM"));
  it("connects to the requested network", async () => { window.midnight = { "random-uuid": wallet }; await expect(connectWallet("preprod")).resolves.toMatchObject({ address: "addr" }); });
  it("explains DUST errors without hiding rejection", () => expect(walletErrorMessage(new Error("BalanceCheckOverspend 138"))).toMatch(/DUST/));
});

