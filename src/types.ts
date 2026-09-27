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
  getConnectionStatus(): Promise<{ status: "connected" | "disconnected"; networkId: string }>;
  getUnshieldedAddress?: () => Promise<{ unshieldedAddress: string }>;
  getDustBalance?: () => Promise<{ balance: bigint; cap: bigint }>;
  getProvingProvider?: (keyMaterialProvider?: unknown) => Promise<unknown>;
  submitTransaction?: (transaction: unknown) => Promise<{ transactionId?: string } | string>;
}

declare global {
  interface Window { midnight?: Record<string, WalletProvider>; }
}

