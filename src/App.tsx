import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CircleAlert, Copy, ExternalLink, EyeOff, Fingerprint, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { getPolicyPlan, getPublicSnapshot, recordReceipt, type PolicyPlan, type PublicMetrics } from "./lib/api";
import { loadRuntimeConfig, transactionExplorerLink, type PublicRuntimeConfig } from "./lib/contracts";
import { callSubmitSignalCircuit, type SubmittedProof } from "./lib/midnight";
import { loadCredential, rotateCredential } from "./lib/privateState";
import { connectWallet, listWallets, walletErrorMessage } from "./lib/wallet";
import type { ConnectedWallet, Network, ProofPhase } from "./types";
import GuidePage from "./GuidePage";

const requirement = "One eligible worker may signal one workplace condition during the April listening window.";
const disclosureScope = ["Eligibility assertion: valid", "Listening window: April 2026", "Aggregate category increment"];
const phases: { id: ProofPhase; title: string }[] = [
  { id: "checking", title: "Checking eligibility" }, { id: "proving", title: "Creating local proof" },
  { id: "submitting", title: "Submitting circuit call" }, { id: "finalizing", title: "Waiting for finalization" },
];

export default function App() {
  const reduce = useReducedMotion();
  const [network, setNetwork] = useState<Network>("preprod");
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [walletName, setWalletName] = useState("No wallet connected");
  const [walletAddress, setWalletAddress] = useState("");
  const [phase, setPhase] = useState<ProofPhase>("idle");
  const [notice, setNotice] = useState("");
  const [receipt, setReceipt] = useState<SubmittedProof | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<PublicRuntimeConfig | null>(null);
  const [plan, setPlan] = useState<PolicyPlan | null>(null);
  const [credentialIssued, setCredentialIssued] = useState("");
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);

  useEffect(() => { setCredentialIssued(loadCredential().issuedAt); }, []);
  useEffect(() => {
    let active = true;
    void loadRuntimeConfig().then((config) => { if (active) setRuntimeConfig(config); }).catch((error) => {
      if (active) setNotice(error instanceof Error ? error.message : "Could not load the public contract registry.");
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    void getPublicSnapshot().then((snapshot) => { if (active) { setMetrics(snapshot.metrics); setServiceOnline(snapshot.service.status === "ok"); } }).catch(() => { if (active) setServiceOnline(false); });
    return () => { active = false; };
  }, []);
  const path = window.location.pathname;
  if (path === "/guide" || path === "/privacy") return <GuidePage path={path} />;
  const connect = async () => {
    try { const connected = await connectWallet(network); setWallet(connected.api); setWalletAddress(connected.address ?? ""); setWalletName(`${connected.provider.name} · connected`); setNotice(""); }
    catch (error) { setNotice(walletErrorMessage(error)); }
  };
  const disconnect = () => { setWallet(null); setWalletAddress(""); setWalletName("Disconnected for this session"); };
  const switchNetwork = (next: Network) => { setNetwork(next); setWallet(null); setWalletAddress(""); setWalletName("Session reset — reconnect on this network"); setReceipt(null); setPhase("idle"); };
  const copyValue = async (label: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied.`); }
    catch { setNotice(`Could not copy the ${label.toLowerCase()}. Select it manually instead.`); }
  };
  const generateProof = async () => {
    if (!wallet) { setNotice("Connect 1AM or another compatible Midnight wallet before generating a proof."); return; }
    if (!runtimeConfig) { setNotice("The public contract registry is still loading. Try again in a moment."); return; }
    try {
      setNotice(""); setReceipt(null); setPhase("checking");
      await new Promise((r) => setTimeout(r, reduce ? 0 : 260)); setPhase("proving");
      await new Promise((r) => setTimeout(r, reduce ? 0 : 350)); setPhase("submitting");
      const selectedDeployment = runtimeConfig.networks[network];
      const result = await callSubmitSignalCircuit(
        wallet,
        { network, windowId: "2026-04", category: 2, credentialSecret: loadCredential().secret },
        { ...selectedDeployment, artifactUrl: runtimeConfig.contractArtifactUrl },
      );
      setPhase("finalizing");
      setReceipt(result);
      if (result.status === "discarded") {
        setPhase("error");
        setNotice("1AM reports that this transaction was discarded. The hash remains visible for diagnosis; no public receipt was recorded.");
        return;
      }
      if (result.status === "finalized") {
        await recordReceipt({ transaction_id: result.transactionHash, network, window_id: "2026-04", disclosure_scope: disclosureScope });
      }
      setPhase("success");
    } catch (error) { setPhase("error"); setNotice(walletErrorMessage(error)); }
  };
  const askGemini = async () => { try { setPlan(await getPolicyPlan(requirement)); } catch (error) { setNotice(error instanceof Error ? error.message : "Assistant unavailable."); } };
  return <main>
    <aside className="rail"><a className="mark" href="#top">QUIET<br />LEDGER<span>®</span></a><p className="rail-label">A worker listening desk</p><nav aria-label="Sections"><a href="#requirement">01 / Window</a><a href="#privacy">02 / Boundary</a><a href="#proof">03 / Proof</a><a href="#ledger">04 / Ledger</a></nav><p className="rail-foot">Built for a slower, safer answer.</p></aside>
    <section className="page" id="top">
      <header className="topline"><span>Worker listening / April 2026</span><div><span className={`status-dot ${serviceOnline === false ? "offline" : ""}`} /> {serviceOnline === null ? "Checking service" : serviceOnline ? "Service ready" : "Service unavailable"} · Network: {network}</div><button className="text-button" onClick={() => wallet ? disconnect() : connect()}>{wallet ? "Disconnect" : "Connect wallet"}</button></header>
      <motion.div initial={{ opacity: 0, y: reduce ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="hero">
        <p className="eyebrow">A private signal. A public count.</p><h1>Say what needs<br /><em>to be heard.</em></h1><p className="lede">Quiet Ledger lets you demonstrate you belong in this listening window—without placing your identity, credential, or written context on a public chain.</p></motion.div>
      <section id="requirement" className="section">
        <div className="section-index">01 / PUBLIC REQUIREMENT</div><div className="main-col"><h2>April listening window</h2><p className="requirement">{requirement}</p><p className="muted">The employer sets this statement publicly. Your response is proven locally.</p></div><aside className="evidence"><span>WINDOW</span><b>OPEN</b><small>Closes 30 Apr, 23:59</small></aside>
      </section>
      <section id="privacy" className="section boundary-section"><div className="section-index">02 / PRIVACY BOUNDARY</div><div className="boundary"><div className="private-side"><span className="boundary-label"><EyeOff size={15} /> LOCAL / PRIVATE</span><h3>Your credential</h3><p>Held for this browser session. It proves membership and creates a one-time nullifier. It is never sent to Gemini, our API, or the ledger.</p><div className="local-chip"><Fingerprint size={18} /><div><b>Eligibility credential ready</b><small>Created {credentialIssued ? new Date(credentialIssued).toLocaleDateString() : "locally"} · cleared when this session ends</small></div><button className="text-button" onClick={() => { const next = rotateCredential(); setCredentialIssued(next.issuedAt); }}>Replace</button></div></div><div className="aperture"><span>ZK</span><i /></div><div className="public-side"><span className="boundary-label"><ShieldCheck size={15} /> LEDGER / PUBLIC</span><h3>Only this leaves</h3><ul>{disclosureScope.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul><p className="muted">No name, wallet address, secret, private note, or exact credential attribute is disclosed.</p></div></div></section>
      <section id="proof" className="section proof-section"><div className="section-index">03 / WALLET & PROOF</div><div className="main-col"><h2>Make one protected signal</h2><div className="network-row" aria-label="Network selector"><span>Network</span>{(["preview", "preprod"] as Network[]).map((item) => <button key={item} className={network === item ? "selected" : ""} onClick={() => switchNetwork(item)}>{item === "preprod" ? "Preprod" : "Preview"}</button>)}</div><div className="wallet-card"><WalletCards size={20} /><div><b>{walletName}</b><small>{listWallets().length ? "1AM is preferred when available" : "Wallet detection happens in your browser only"}</small></div>{!wallet && <button className="secondary" onClick={connect}>Connect</button>}</div><div className="connection-ledger" aria-label="Connection details"><div><span>CONNECTED WALLET</span>{walletAddress ? <><code>{walletAddress}</code><button className="icon-button" onClick={() => copyValue("Wallet address", walletAddress)} aria-label="Copy wallet address"><Copy size={14} /></button></> : <em>Connect 1AM to reveal your wallet address</em>}</div><div><span>QUIET LEDGER CONTRACT · {network.toUpperCase()}</span>{runtimeConfig?.networks[network].contractAddress ? <><code>{runtimeConfig.networks[network].contractAddress}</code><button className="icon-button" onClick={() => copyValue("Contract address", runtimeConfig.networks[network].contractAddress)} aria-label="Copy contract address"><Copy size={14} /></button></> : <em>Not deployed in the public registry</em>}</div></div><button className="primary" onClick={generateProof} disabled={phase !== "idle" && phase !== "error"}><ShieldCheck size={18} /> Generate protected proof</button></div><aside className="evidence proof-status"><span>PROOF STATUS</span>{phases.map((item) => <div key={item.id} className={phase === item.id ? "active" : phases.findIndex((p) => p.id === phase) > phases.findIndex((p) => p.id === item.id) || phase === "success" ? "done" : ""}><i />{item.title}</div>)}<small>1AM provides your wallet address and verifies the submitted transaction hash. The app supplies the public contract address for the selected network.</small></aside></section>
      <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="notice" role="alert"><CircleAlert size={18} />{notice}<button onClick={() => setNotice("")}>Dismiss</button></motion.div>}</AnimatePresence>
      <section id="ledger" className="section"><div className="section-index">04 / PUBLIC LEDGER</div><div className="main-col"><h2>Receipt, not a profile</h2>{receipt ? <div className={`receipt ${receipt.status === "discarded" ? "discarded" : "success"}`}><Check size={20} /><div className="receipt-body"><div className="receipt-heading"><b>{receipt.status === "finalized" ? "Finalized receipt" : receipt.status === "discarded" ? "Discarded transaction" : "Submitted receipt"}</b><span>{receipt.status}</span></div><dl><div><dt>Network</dt><dd>{receipt.network}</dd></div><div><dt>Contract address</dt><dd><code>{receipt.contractAddress}</code><button className="icon-button" onClick={() => copyValue("Contract address", receipt.contractAddress)} aria-label="Copy contract address"><Copy size={14} /></button></dd></div><div><dt>Transaction hash</dt><dd><code>{receipt.transactionHash}</code><button className="icon-button" onClick={() => copyValue("Transaction hash", receipt.transactionHash)} aria-label="Copy transaction hash"><Copy size={14} /></button>{runtimeConfig && transactionExplorerLink(runtimeConfig.networks[receipt.network], receipt.transactionHash) && <a className="icon-button" href={transactionExplorerLink(runtimeConfig.networks[receipt.network], receipt.transactionHash)} target="_blank" rel="noreferrer" aria-label="Open transaction explorer"><ExternalLink size={14} /></a>}</dd></div></dl><small>{receipt.status === "finalized" ? "Public outcome recorded" : receipt.status === "discarded" ? "Not recorded as a public outcome" : "1AM has accepted this transaction; finalization may still be in progress"}</small></div></div> : <div className="receipt"><LoaderCircle size={20} /><div><b>No transaction submitted</b><p>After a wallet-confirmed circuit call is submitted, its contract address and real transaction hash will be shown here.</p></div></div>}</div><aside className="evidence metrics"><span>PUBLIC PULSE</span><b>{metrics ? metrics.finalized_receipts : "—"}</b><small>{metrics ? `verified signals across ${metrics.unique_windows} public window${metrics.unique_windows === 1 ? "" : "s"}` : "live public count unavailable"}</small><div><i />No worker profile</div><div><i />No raw feedback</div><div><i />No wallet address published</div></aside></section>
      <section className="assistant-panel"><div><p className="eyebrow">Public-policy assistant</p><h2>What exactly am I proving?</h2><p>Gemini sees the public requirement only. It does not receive local credentials, wallet data, private notes, or proof inputs.</p><button className="secondary" onClick={askGemini}>Explain this boundary</button></div>{plan ? <div className="plan"><b>{plan.headline}</b><p>{plan.explanation}</p>{plan.disclosures.map((d) => <small key={d}>— {d}</small>)}</div> : <div className="plan ghost">A concise explanation will appear here, using only the public window policy.</div>}</section>
      <footer>Quiet Ledger is a privacy-preserving workplace listening prototype. <a href="/guide">How it works</a> · <a href="/privacy">Privacy notes</a> · <a href="https://docs.midnight.network/" target="_blank">How Midnight protects proofs ↗</a></footer>
    </section>
  </main>;
}
