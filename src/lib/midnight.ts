import type { ConnectedWallet, Network, WalletHistoryEntry, WalletTransactionStatus } from "../types";
import type { ContractDeployment } from "./contracts";

export interface CircuitCall { network: Network; windowId: string; category: number; credentialSecret: string; }
export interface SubmittedProof {
  transactionHash: string;
  contractAddress: string;
  network: Network;
  status: WalletTransactionStatus["status"];
}

interface ContractRuntime extends ContractDeployment { artifactUrl: string; }
interface BuiltTransaction { tx?: unknown; transaction?: unknown; txHash?: unknown; transactionId?: unknown; }

const historyHashes = (history: WalletHistoryEntry[]): Set<string> => new Set(history.map((entry) => entry.txHash));

export const findSubmittedTransaction = (
  history: WalletHistoryEntry[],
  before: ReadonlySet<string>,
  preferredHash?: string,
): WalletHistoryEntry | undefined => {
  if (preferredHash) {
    const match = history.find((entry) => entry.txHash === preferredHash);
    if (match) return match;
  }
  return history.find((entry) => !before.has(entry.txHash));
};

const resultHash = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return undefined;
  const result = value as Record<string, unknown>;
  const candidate = result.txHash ?? result.transactionId;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;
};

const pause = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

export async function waitForSubmittedTransaction(
  wallet: ConnectedWallet,
  before: ReadonlySet<string>,
  preferredHash?: string,
  attempts = 12,
  intervalMs = 1_000,
): Promise<WalletHistoryEntry> {
  if (!wallet.getTxHistory) {
    if (preferredHash) return { txHash: preferredHash, txStatus: { status: "pending" } };
    throw new Error("The wallet submitted the transaction but does not expose transaction history, so its hash cannot be verified.");
  }
  let observed: WalletHistoryEntry | undefined;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const entry = findSubmittedTransaction(await wallet.getTxHistory(0, 25), before, preferredHash);
    if (entry) {
      observed = entry;
      if (entry.txStatus.status === "finalized" || entry.txStatus.status === "discarded") return entry;
    }
    if (attempt < attempts - 1) await pause(intervalMs);
  }
  if (observed) return observed;
  throw new Error("The wallet accepted the transaction, but its transaction hash has not appeared in wallet history yet. Check 1AM before retrying.");
}

const serializedTransaction = (built: unknown): { tx: string; hash?: string } => {
  if (typeof built === "string" && built) return { tx: built };
  if (!built || typeof built !== "object") throw new Error("The generated Compact client did not return a serialized transaction.");
  const value = built as BuiltTransaction;
  const tx = typeof value.tx === "string" ? value.tx : typeof value.transaction === "string" ? value.transaction : undefined;
  if (!tx) throw new Error("The generated Compact client did not return a serialized transaction.");
  return { tx, hash: resultHash(value) };
};

/**
 * Boundary to the generated Compact client. Contract addresses come from the public,
 * network-specific runtime registry; private witness material stays in this call.
 */
export async function callSubmitSignalCircuit(
  wallet: ConnectedWallet,
  call: CircuitCall,
  runtime: ContractRuntime,
): Promise<SubmittedProof> {
  if (!runtime.contractAddress) throw new Error(`Quiet Ledger is not deployed on ${call.network} yet.`);
  if (!wallet.getProvingProvider || !wallet.submitTransaction) throw new Error("This wallet cannot provide proving and transaction submission.");
  const contract = await import(/* @vite-ignore */ runtime.artifactUrl);
  if (typeof contract.buildSubmitSignalTransaction !== "function") {
    throw new Error("Generated Compact client is missing buildSubmitSignalTransaction. Recompile contract artifacts.");
  }

  const before = wallet.getTxHistory ? historyHashes(await wallet.getTxHistory(0, 25)) : new Set<string>();
  const prover = await wallet.getProvingProvider();
  const built = serializedTransaction(await contract.buildSubmitSignalTransaction({
    contractAddress: runtime.contractAddress,
    prover,
    ...call,
  }));
  const submissionResult = await wallet.submitTransaction(built.tx);
  const entry = await waitForSubmittedTransaction(wallet, before, resultHash(submissionResult) ?? built.hash);
  return {
    transactionHash: entry.txHash,
    contractAddress: runtime.contractAddress,
    network: call.network,
    status: entry.txStatus.status,
  };
}

