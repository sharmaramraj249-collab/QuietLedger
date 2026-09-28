import type { ConnectedAPI, HistoryEntry, InitialAPI, TxStatus } from "@midnight-ntwrk/dapp-connector-api";

export type Network = "preview" | "preprod";
export type ProofPhase = "idle" | "deploying" | "checking" | "proving" | "submitting" | "finalizing" | "success" | "error";
export type WalletProvider = InitialAPI;
export type ConnectedWallet = ConnectedAPI;
export type WalletHistoryEntry = HistoryEntry;
export type WalletTransactionStatus = TxStatus;

