import { NextRequest, NextResponse } from "next/server";
import { AssetMetadata, BlockfrostProvider, ForgeScript, MeshWallet, Mint, Transaction } from "@meshsdk/core";


export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    const { recipientAddress, selectedUtxos, mintingFee } = body;

    if (!recipientAddress || !selectedUtxos || !mintingFee) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Split mnemonic into array of words
    const mnemonicWords = (process.env.MNEMONIC_PHRASE || "").trim().split(/\s+/);
    const projectId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD;
    if (!projectId) {
      throw new Error("Missing Blockfrost project ID environment variable");
    }

    // Initialize Blockfrost provider
    const provider = new BlockfrostProvider(projectId);

    // Initialize MeshWallet from mnemonic
    const meshWallet = new MeshWallet({
      networkId: 0, // 0 = preview/testnet; change to 1 for mainnet
      fetcher: provider,
      submitter: provider,
      key: {
        type: "mnemonic",
        words: mnemonicWords,
      },
    });

    console.log("Recipient Address:", recipientAddress);
    console.log("Selected UTXOs:", selectedUtxos);
    console.log("Minting Fee:", mintingFee);

    const meshWalletAddress = meshWallet.getChangeAddress();
    const forgingScript = ForgeScript.withOneSignature(await meshWalletAddress);

    const assetName = 'MeshToken';

    const assetMetadata: AssetMetadata = {
        name: 'Mesh Token',
        image: 'ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua',
        mediaType: 'image/jpg',
        description: 'This NFT was minted by Mesh (https://meshjs.dev/).',
    };

    const asset: Mint = {
        assetName: assetName,
        assetQuantity: '1',
        metadata: assetMetadata,
        label: '721',
        recipient: recipientAddress,
    };

    console.log("vsdvvsdv",selectedUtxos);
    console.log("mint",mintingFee);


    const tx = new Transaction({ initiator: meshWallet });
    tx.setTxInputs(selectedUtxos);
    tx.mintAsset(forgingScript, asset);
    tx.sendLovelace("addr_test1qqqyy0nngxfrkzge8r33l903d20a9crckx9e6q0dtzftk2u5rxgdr6jurcdejtv23lgrham9cmttn4hgp5avjd0nlvgqay3kec", mintingFee);
    tx.setChangeAddress(recipientAddress);
    const unsignedTx = await tx.build();

    // TODO: Build & sign minting transaction here with meshWallet

    return NextResponse.json({
      message: "Mint API received data successfully",
      unsignedTx,
    });
  } catch (error: any) {
    console.error("Mint API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
