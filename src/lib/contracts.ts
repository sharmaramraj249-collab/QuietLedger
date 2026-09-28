import type { Network } from "../types";

export interface ContractDeployment {
  contractAddress: string;
  transactionExplorerUrl?: string;
}

export interface PublicRuntimeConfig {
  contractArtifactUrl: string;
  networks: Record<Network, ContractDeployment>;
}

const CONFIG_URL = "/quiet-ledger.config.json";
let cachedConfig: Promise<PublicRuntimeConfig> | undefined;

const deployment = (value: unknown): ContractDeployment => {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    contractAddress: typeof item.contractAddress === "string" ? item.contractAddress.trim() : "",
    transactionExplorerUrl: typeof item.transactionExplorerUrl === "string" && item.transactionExplorerUrl.trim()
      ? item.transactionExplorerUrl.trim()
      : undefined,
  };
};

export const parseRuntimeConfig = (value: unknown): PublicRuntimeConfig => {
  if (!value || typeof value !== "object") throw new Error("The public contract registry is invalid.");
  const config = value as Record<string, unknown>;
  const networks = config.networks && typeof config.networks === "object"
    ? config.networks as Record<string, unknown>
    : {};
  const contractArtifactUrl = typeof config.contractArtifactUrl === "string" ? config.contractArtifactUrl.trim() : "";
  if (!contractArtifactUrl) throw new Error("The public contract registry is missing its Compact client path.");
  return {
    contractArtifactUrl,
    networks: {
      preview: deployment(networks.preview),
      preprod: deployment(networks.preprod),
    },
  };
};

export const loadRuntimeConfig = (): Promise<PublicRuntimeConfig> => {
  cachedConfig ??= fetch(CONFIG_URL, { cache: "no-store", headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load the public contract registry (${response.status}).`);
      return response.json() as Promise<unknown>;
    })
    .then(parseRuntimeConfig)
    .catch((error) => {
      cachedConfig = undefined;
      throw error;
    });
  return cachedConfig;
};

export const transactionExplorerLink = (deploymentConfig: ContractDeployment, txHash: string): string | undefined => {
  if (!deploymentConfig.transactionExplorerUrl) return undefined;
  return deploymentConfig.transactionExplorerUrl.replace("{txHash}", encodeURIComponent(txHash));
};
