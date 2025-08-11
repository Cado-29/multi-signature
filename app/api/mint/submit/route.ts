import { NextRequest, NextResponse } from "next/server";
import { BlockfrostProvider, MeshWallet, Transaction } from "@meshsdk/core";


export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    const { signedTx, originalMetadata } = body;

    if (!signedTx) {
      return NextResponse.json({ error: "Missing signedTx" }, { status: 400 });
    }

    const mnemonicWords = (process.env.MNEMONIC_PHRASE || "").trim().split(/\s+/);

    const projectId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD;
    if (!projectId) {
      throw new Error("Missing Blockfrost project ID environment variable");
    }

    const provider = new BlockfrostProvider(projectId);
    const systemWallet = new MeshWallet({
        networkId: 0,
        fetcher: provider,
        submitter: provider,
        key: {
            type: "mnemonic",
            words: mnemonicWords,
        },
    });
    const meshWalletSignedTx = await systemWallet.signTx(signedTx, true); 

  
    return NextResponse.json({ meshWalletSignedTx });
    
  } catch (error: any) {
    console.error("Submit mint API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
