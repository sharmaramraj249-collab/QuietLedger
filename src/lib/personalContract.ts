/* eslint-disable @typescript-eslint/no-explicit-any -- generated Compact bindings are created during the Netlify build */
import type { DAppConnectorProvingAPI } from "@midnight-ntwrk/midnight-js-dapp-connector-proof-provider";
import { dappConnectorProvingProvider } from "@midnight-ntwrk/midnight-js-dapp-connector-proof-provider";
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import type { CoinPublicKey, EncPublicKey, FinalizedTransaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { Transaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type { MidnightProvider, UnboundTransaction, WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import { createProofProvider } from "@midnight-ntwrk/midnight-js-types";
import * as Generated from "virtual:quiet-ledger-contract";
import type { ConnectedWallet, Network } from "../types";
import { savePersonalDeployment, type PersonalDeployment, type PersonalSignalReceipt } from "./personalContractStorage";

const PRIVATE_STATE_ID = "quietLedgerPersonalState";
const ASSET_BASE = "/contracts/quiet-ledger";

interface PersonalPrivateState {
  nullifierSecret: Uint8Array;
}

const bytesToHex = (bytes: Uint8Array): string => Array.from(bytes)
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

const hexToBytes = (hex: string): Uint8Array => {
  const normalized = hex.replace(/^0x/, "");
  if (!/^[a-f0-9]+$/i.test(normalized) || normalized.length % 2 !== 0) throw new Error("Wallet returned an invalid transaction encoding.");
  return new Uint8Array(normalized.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
};

const windowField = (windowId: string): bigint => {
  const value = windowId.replace(/\D/g, "");
  if (!value) throw new Error("Listening window is invalid.");
  return BigInt(value);
};

const privateState = (credentialSecret: string): PersonalPrivateState => {
  const nullifierSecret = hexToBytes(credentialSecret);
  if (nullifierSecret.length !== 32) throw new Error("The local credential must contain 32 bytes of private material.");
  return { nullifierSecret };
};

const compiledContract = () => {
  const Contract = (Generated as { Contract?: new (...args: any[]) => any }).Contract;
  if (!Contract) throw new Error("Compact deployment artifacts are missing from this build.");
  const witnesses = {
    nullifierSecret: ({ privateState: state }: { privateState: PersonalPrivateState }) => [state, state.nullifierSecret],
  };
  const withWitnesses = CompiledContract.withWitnesses as unknown as (value: any) => (self: any) => any;
  const withAssets = CompiledContract.withCompiledFileAssets as unknown as (value: string) => (self: any) => any;
  return CompiledContract.make("QuietLedgerPersonal", Contract as any).pipe(
    withWitnesses(witnesses),
    withAssets("."),
  );
};

const walletProviders = (wallet: ConnectedWallet, shielded: { shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string }) => {
  if (!wallet.balanceUnsealedTransaction || !wallet.submitTransaction) throw new Error("1AM does not expose contract transaction balancing and submission.");
  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shielded.shieldedCoinPublicKey as CoinPublicKey,
    getEncryptionPublicKey: () => shielded.shieldedEncryptionPublicKey as EncPublicKey,
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const balanced = await wallet.balanceUnsealedTransaction!(bytesToHex(tx.serialize()));
      return Transaction.deserialize("signature", "proof", "binding", hexToBytes(balanced.tx)) as FinalizedTransaction;
    },
  };
  const midnightProvider: MidnightProvider = {
    async submitTx(tx: FinalizedTransaction) {
      await wallet.submitTransaction!(bytesToHex(tx.serialize()));
      return tx.identifiers()[0];
    },
  };
  return { walletProvider, midnightProvider };
};

const providersFor = async (wallet: ConnectedWallet, network: Network, credentialSecret: string) => {
  if (!wallet.getConfiguration || !wallet.getShieldedAddresses || !wallet.getProvingProvider) {
    throw new Error("1AM is missing one or more APIs required for personal contract deployment.");
  }
  setNetworkId(network);
  const configuration = await wallet.getConfiguration();
  if (configuration.networkId !== network) throw new Error(`1AM is connected to ${configuration.networkId}, not ${network}.`);
  const shielded = await wallet.getShieldedAddresses();
  const zkConfigProvider = new FetchZkConfigProvider<"submitSignal">(`${window.location.origin}${ASSET_BASE}`, fetch.bind(window));
  const provingProvider = await dappConnectorProvingProvider(wallet as unknown as DAppConnectorProvingAPI, zkConfigProvider);
  const proofProvider = createProofProvider(provingProvider);
  const { walletProvider, midnightProvider } = walletProviders(wallet, shielded);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: () => `QuietLedger!Aa1:${credentialSecret}`,
      accountId: shielded.shieldedAddress,
      midnightDbName: "quiet-ledger-personal-state",
    }),
    publicDataProvider: indexerPublicDataProvider(
      configuration.indexerUri,
      configuration.indexerWsUri,
      globalThis.WebSocket,
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
};

export async function deployPersonalContract(
  wallet: ConnectedWallet,
  network: Network,
  walletAddress: string,
  credentialSecret: string,
  listeningWindow: string,
): Promise<PersonalDeployment> {
  const state = privateState(credentialSecret);
  const providers = await providersFor(wallet, network, credentialSecret);
  const deployed = await deployContract(providers as any, {
    compiledContract: compiledContract(),
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: state,
    args: [windowField(listeningWindow)],
  } as any);
  const deployment: PersonalDeployment = {
    network,
    walletAddress,
    contractAddress: deployed.deployTxData.public.contractAddress,
    deploymentTransactionHash: deployed.deployTxData.public.txHash,
  };
  savePersonalDeployment(deployment);
  return deployment;
}

export async function submitPersonalSignal(
  wallet: ConnectedWallet,
  deployment: PersonalDeployment,
  credentialSecret: string,
  listeningWindow: string,
): Promise<PersonalSignalReceipt> {
  const state = privateState(credentialSecret);
  const providers = await providersFor(wallet, deployment.network, credentialSecret);
  providers.privateStateProvider.setContractAddress(deployment.contractAddress as any);
  const found = await findDeployedContract(providers as any, {
    compiledContract: compiledContract(),
    contractAddress: deployment.contractAddress,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: state,
  } as any);
  const tx = await found.callTx.submitSignal(windowField(listeningWindow));
  return {
    ...deployment,
    transactionHash: tx.public.txHash,
    status: "finalized",
  };
}
