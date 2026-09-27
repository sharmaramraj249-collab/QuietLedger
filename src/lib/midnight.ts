import type { ConnectedWallet, Network } from "../types";

export interface CircuitCall { network: Network; windowId: string; category: number; credentialSecret: string; }
export interface SubmittedProof { transactionId: string; network: Network; }

/**
 * Boundary to the generated Compact client. This intentionally never simulates a chain response.
 * `contract/index.js` is emitted by `compactc` and supplied at deployment time.
 */
export async function callSubmitSignalCircuit(wallet: ConnectedWallet, call: CircuitCall): Promise<SubmittedProof> {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
  if (!address) throw new Error("Compact contract is not configured. Deploy QuietLedger before submitting a proof.");
  if (!wallet.getProvingProvider || !wallet.submitTransaction) throw new Error("This wallet cannot provide proving and transaction submission.");
  const artifactUrl = import.meta.env.VITE_CONTRACT_ARTIFACT_URL as string || "/contracts/quiet-ledger/contract/index.js";
  const contract = await import(/* @vite-ignore */ artifactUrl);
  if (typeof contract.buildSubmitSignalTransaction !== "function") {
    throw new Error("Generated Compact client is missing buildSubmitSignalTransaction. Recompile contract artifacts.");
  }
  const prover = await wallet.getProvingProvider();
  const transaction = await contract.buildSubmitSignalTransaction({ contractAddress: address, prover, ...call });
  const result = await wallet.submitTransaction(transaction);
  const transactionId = typeof result === "string" ? result : result.transactionId;
  if (!transactionId) throw new Error("The wallet did not return a transaction ID; receipt cannot be created.");
  return { transactionId, network: call.network };
}

