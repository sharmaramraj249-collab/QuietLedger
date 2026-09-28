import type { Network } from "../types";

const STORAGE_KEY = "quiet-ledger:personal-deployments:v1";

export interface PersonalDeployment {
  network: Network;
  walletAddress: string;
  contractAddress: string;
  deploymentTransactionHash: string;
}

export interface PersonalSignalReceipt extends PersonalDeployment {
  transactionHash: string;
  status: "finalized";
}

type StoredDeployments = Partial<Record<Network, PersonalDeployment>>;

export const savePersonalDeployment = (deployment: PersonalDeployment): void => {
  const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as StoredDeployments;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, [deployment.network]: deployment }));
};

export const loadPersonalDeployment = (network: Network, walletAddress: string): PersonalDeployment | null => {
  try {
    const deployment = (JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as StoredDeployments)[network];
    return deployment?.walletAddress === walletAddress && deployment.contractAddress ? deployment : null;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearPersonalDeployment = (network: Network): void => {
  const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as StoredDeployments;
  delete existing[network];
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};
