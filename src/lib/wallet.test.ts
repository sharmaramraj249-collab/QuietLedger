import { describe, expect, it } from "vitest";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { connectWallet, selectPreferredWallet, walletErrorMessage } from "./wallet";

const connection = (networkId: string, address = "addr") => ({
  getConnectionStatus: async () => ({ status: "connected" as const, networkId }),
  getUnshieldedAddress: async () => ({ unshieldedAddress: address }),
}) as unknown as ConnectedAPI;
const wallet = {
  name: "Other", rdns: "example.wallet", icon: "data:image/svg+xml,", apiVersion: "4.0.1",
  connect: async () => connection("preprod"),
} satisfies InitialAPI;
describe("wallet discovery", () => {
  it("prefers 1AM from UUID-keyed providers", () => expect(selectPreferredWallet([wallet, { ...wallet, name: "1AM", rdns: "io.1am" }]).name).toBe("1AM"));
  it("connects to the requested network", async () => { window.midnight = { "random-uuid": wallet }; await expect(connectWallet("preprod")).resolves.toMatchObject({ address: "addr" }); });
  it("rejects a wallet session on the wrong network", async () => {
    window.midnight = { "random-uuid": { ...wallet, connect: async () => connection("preview") } };
    await expect(connectWallet("preprod")).rejects.toThrow(/preview.*preprod/);
  });
  it("explains DUST errors without hiding rejection", () => expect(walletErrorMessage(new Error("BalanceCheckOverspend 138"))).toMatch(/DUST/));
});

