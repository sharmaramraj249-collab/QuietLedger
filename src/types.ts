export type Network = "preview" | "preprod";
export type ProofPhase = "idle" | "checking" | "proving" | "submitting" | "finalizing" | "success" | "error";

export interface WalletProvider {
  name: string;
  rdns?: string;
  apiVersion: string;
  icon?: string;
  connect(networkId: string): Promise<ConnectedWallet>;
}

export interface ConnectedWallet {
  getConnectionStatus(): Promise<{ status: "connected"; networkId: string } | { status: "disconnected" }>;
  getUnshieldedAddress?: () => Promise<{ unshieldedAddress: string }>;
  getDustBalance?: () => Promise<{ balance: bigint; cap: bigint }>;
  getTxHistory?: (pageNumber: number, pageSize: number) => Promise<WalletHistoryEntry[]>;
  getProvingProvider?: (keyMaterialProvider?: unknown) => Promise<unknown>;
  submitTransaction?: (transaction: string) => Promise<void | string | { transactionId?: string; txHash?: string }>;
}

export type WalletTransactionStatus =
  | { status: "pending" | "discarded" }
  | { status: "confirmed" | "finalized"; executionStatus?: Record<number, "Success" | "Failure"> };

export interface WalletHistoryEntry {
  txHash: string;
  txStatus: WalletTransactionStatus;
}

declare global {
  interface Window { midnight?: Record<string, WalletProvider>; }
}

