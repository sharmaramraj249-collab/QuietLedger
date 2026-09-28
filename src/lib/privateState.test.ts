import { describe, expect, it } from "vitest";
import { clearCredential, loadCredential, rotateCredential } from "./privateState";
describe("private state", () => {
  it("persists local-only credential material for the current browser session", () => { const first = loadCredential(); expect(loadCredential().secret).toBe(first.secret); });
  it("creates a full 32-byte credential secret", () => expect(loadCredential().secret).toMatch(/^[a-f0-9]{64}$/));
  it("rotates the local secret", () => { const first = loadCredential(); expect(rotateCredential().secret).not.toBe(first.secret); });
  it("can clear the local credential", () => { loadCredential(); clearCredential(); expect(sessionStorage.getItem("quiet-ledger:credential:v2")).toBeNull(); });
});
