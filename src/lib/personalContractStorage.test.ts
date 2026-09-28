import { beforeEach, describe, expect, it } from "vitest";
import { clearPersonalDeployment, loadPersonalDeployment, savePersonalDeployment } from "./personalContractStorage";

const deployment = {
  network: "preprod" as const,
  walletAddress: "mn_addr_worker",
  contractAddress: "0200_contract",
  deploymentTransactionHash: "deployment_tx_hash",
};

describe("personal contract storage", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores a deployment only for its owning wallet and network", () => {
    savePersonalDeployment(deployment);
    expect(loadPersonalDeployment("preprod", deployment.walletAddress)).toEqual(deployment);
    expect(loadPersonalDeployment("preprod", "another_wallet")).toBeNull();
    expect(loadPersonalDeployment("preview", deployment.walletAddress)).toBeNull();
  });

  it("clears one network without removing another", () => {
    savePersonalDeployment(deployment);
    savePersonalDeployment({ ...deployment, network: "preview", contractAddress: "0200_preview" });
    clearPersonalDeployment("preprod");
    expect(loadPersonalDeployment("preprod", deployment.walletAddress)).toBeNull();
    expect(loadPersonalDeployment("preview", deployment.walletAddress)?.contractAddress).toBe("0200_preview");
  });

  it("recovers safely from corrupt session data", () => {
    sessionStorage.setItem("quiet-ledger:personal-deployments:v1", "not-json");
    expect(loadPersonalDeployment("preprod", deployment.walletAddress)).toBeNull();
  });
});
