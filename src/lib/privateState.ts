const KEY = "quiet-ledger:credential:v2";
export interface LocalCredential { secret: string; issuedAt: string; label: string; }

const storage = () => window.sessionStorage;

const randomHex = (length: number): string => Array.from(crypto.getRandomValues(new Uint8Array(length)))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

export const createLocalCredential = (): LocalCredential => ({
  secret: randomHex(32), issuedAt: new Date().toISOString(), label: "Eligibility credential",
});
export const loadCredential = (): LocalCredential => {
  const raw = storage().getItem(KEY);
  if (raw) {
    try {
      const credential = JSON.parse(raw) as LocalCredential;
      if (/^[a-f0-9]{64}$/i.test(credential.secret) && credential.issuedAt) return credential;
    } catch { storage().removeItem(KEY); }
  }
  const credential = createLocalCredential(); storage().setItem(KEY, JSON.stringify(credential)); return credential;
};
export const rotateCredential = (): LocalCredential => {
  const credential = createLocalCredential(); storage().setItem(KEY, JSON.stringify(credential)); return credential;
};
export const clearCredential = () => storage().removeItem(KEY);
