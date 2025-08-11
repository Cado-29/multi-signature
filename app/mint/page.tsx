"use client";

import { CardanoWallet, useWallet } from "@meshsdk/react";

export default function Page() {
  const { connected, wallet } = useWallet();

  const startMinting = async () => {
    if (!connected || !wallet) {
      console.log("Wallet not connected");
      return;
    }

    try {
      const recipientAddress = await wallet.getChangeAddress();
      console.log("Recipient Address:", recipientAddress);

      const utxos = await wallet.getUtxos();
      console.log("UTXOs:", utxos);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <CardanoWallet />

      {connected && (
        <button
          onClick={startMinting}
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            background: "blue",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Start Minting
        </button>
      )}
    </div>
  );
}
