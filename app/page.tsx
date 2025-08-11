"use client";

import { experimentalSelectUtxos, Quantity, Unit } from "@meshsdk/common";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { useState } from "react";

export default function Page() {
  const { connected, wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMinting = async () => {
    if (!connected || !wallet) {
      setError("Wallet not connected");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Get recipient address (change address)
      const recipientAddress = await wallet.getChangeAddress();

      // 2. Get all UTXOs in wallet
      const utxos = await wallet.getUtxos();

      // 3. Prepare asset map for coin selection
      const mintingFee = "5000000"; // example fee in lovelace, adjust as needed

      const assetMap = new Map<Unit, Quantity>();
      assetMap.set("lovelace", mintingFee);

      // Note: '5000000' is buffer in lovelace as string, adjust if needed
      const selectedUtxos = experimentalSelectUtxos(assetMap, utxos, "10000000");

      console.log("Recipient Address:", recipientAddress);
      console.log("Selected UTXOs:", selectedUtxos);

      // 5. Send to backend for building minting transaction
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientAddress,
          selectedUtxos,
          mintingFee,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Minting transaction build failed");
      }

      const { unsignedTx } = await response.json();

      console.log("Unsigned transaction received:", unsignedTx);

      // 6. Client signs the transaction partially
      const signedTx = await wallet.signTx(unsignedTx, true);
      console.log("Client partially signed tx:", signedTx);

      // 7. Send signedTx back to backend for application signing & submission
      // Replace /api/mint/submit with your actual submit endpoint
      const submitResponse = await fetch("/api/mint/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signedTx,
          originalMetadata: unsignedTx.metadata || null, // if you have metadata masking
        }),
      });

      if (!submitResponse.ok) {
        const msg = await submitResponse.text();
        throw new Error(msg || "Minting transaction submission failed");
      }

      const { meshWalletSignedTx } = await submitResponse.json();
      const txHash = await wallet.submitTx(meshWalletSignedTx);
      console.log("Transaction successfully submitted, txHash:", txHash);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <CardanoWallet />

      {connected && (
        <button
          onClick={startMinting}
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            background: loading ? "gray" : "blue",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Minting..." : "Start Minting"}
        </button>
      )}

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}
