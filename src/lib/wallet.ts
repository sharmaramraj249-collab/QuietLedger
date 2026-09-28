import type { ConnectedWallet, Network, WalletProvider } from "../types";

export const listWallets = (): WalletProvider[] => Object.values(window.midnight ?? {})
  .filter((wallet): wallet is WalletProvider => Boolean(wallet?.name && wallet?.apiVersion));

export const selectPreferredWallet = (wallets = listWallets()): WalletProvider => {
  if (!wallets.length) throw new Error("No Midnight wallet found. Install and unlock 1AM, then refresh.");
  return wallets.find((wallet) => /(^|\s)1am(\s|$)/i.test(`${wallet.name} ${wallet.rdns ?? ""}`)) ?? wallets[0];
};

export const connectWallet = async (network: Network): Promise<{ provider: WalletProvider; api: ConnectedWallet; address?: string; dust?: bigint }> => {
  const provider = selectPreferredWallet();
  // Must be invoked directly by the user click handler: browser wallets may open an authorization popup.
  const api = await provider.connect(network);
  const status = await api.getConnectionStatus();
  if (status.status !== "connected") throw new Error("Wallet disconnected before authorization completed.");
  if (status.networkId !== network) throw new Error(`Wallet connected to ${status.networkId}, but ${network} was requested. Switch networks in 1AM and reconnect.`);
  const address = api.getUnshieldedAddress ? (await api.getUnshieldedAddress()).unshieldedAddress : undefined;
  const dust = api.getDustBalance ? (await api.getDustBalance()).balance : undefined;
  return { provider, api, address, dust };
};

export const walletErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (/overspend|dust|138/i.test(message)) return "Insufficient DUST. Let DUST regenerate or fund the connected wallet, then retry.";
  if (/reject|denied|cancel/i.test(message)) return "The wallet request was rejected. Nothing was submitted.";
  if (/proof|prover|proving/i.test(message)) return "The proving service was unavailable. Check the wallet proof provider or local proof server.";
  if (/indexer/i.test(message)) return "The indexer could not confirm this transaction yet. Check the receipt later.";
  return message;
};

