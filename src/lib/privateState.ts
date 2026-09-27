const KEY = "quiet-ledger:credential:v2";
export interface LocalCredential { secret: string; issuedAt: string; label: string; }

const storage = () => window.sessionStorage;

export const createLocalCredential = (): LocalCredential => ({
  secret: crypto.randomUUID().replaceAll("-", ""), issuedAt: new Date().toISOString(), label: "Eligibility credential",
});
export const loadCredential = (): LocalCredential => {
  const raw = storage().getItem(KEY);
  if (raw) {
    try {
      const credential = JSON.parse(raw) as LocalCredential;
      if (credential.secret && credential.issuedAt) return credential;
    } catch { storage().removeItem(KEY); }
  }
  const credential = createLocalCredential(); storage().setItem(KEY, JSON.stringify(credential)); return credential;
};
export const rotateCredential = (): LocalCredential => {
  const credential = createLocalCredential(); storage().setItem(KEY, JSON.stringify(credential)); return credential;
};
export const clearCredential = () => storage().removeItem(KEY);
