import { describe, expect, it } from "vitest";
import { parseRuntimeConfig, transactionExplorerLink } from "./contracts";

describe("public contract registry", () => {
  it("keeps separate Preview and Preprod deployments", () => {
    const config = parseRuntimeConfig({
      contractArtifactUrl: "/contract/index.js",
      networks: {
        preview: { contractAddress: " preview-address " },
        preprod: { contractAddress: "preprod-address" },
      },
    });
    expect(config.networks.preview.contractAddress).toBe("preview-address");
    expect(config.networks.preprod.contractAddress).toBe("preprod-address");
  });

  it("builds an optional explorer link from the verified transaction hash", () => {
    expect(transactionExplorerLink({ contractAddress: "contract", transactionExplorerUrl: "https://explorer.example/tx/{txHash}" }, "a/b"))
      .toBe("https://explorer.example/tx/a%2Fb");
  });
});
