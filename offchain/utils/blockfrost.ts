export async function getLatestBlockInfo() {
  const block = await fetch("https://cardano-preview.blockfrost.io/api/v0/blocks/latest", {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  const blockJson = await block.json();
  // console.log({ blockJson: blockJson });

  return blockJson;
}

export async function getDatumFields(datumHash: string) {
  const datum = await fetch(`https://cardano-preview.blockfrost.io/api/v0/scripts/datum/${datumHash}`, {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  const datumJson = await datum.json();
  // console.log({ datumJson: datumJson });
  const datumJsonValue = datumJson["json_value"];
  // console.log({ datumJsonValue: datumJsonValue });
  const datumFields = datumJsonValue["fields"];
  // console.log({ datumFields: datumFields });

  return datumFields;
}

export async function getScriptCBOR(scriptHash: string) {
  return (
    await (
      await fetch(`https://cardano-preview.blockfrost.io/api/v0/scripts/${scriptHash}/cbor`, {
        headers: {
          project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
        },
      })
    ).json()
  )["cbor"];
}

export async function getTxUTxOs(txHash: string) {
  return (
    await fetch(`https://cardano-preview.blockfrost.io/api/v0/txs/${txHash}/utxos`, {
      headers: {
        project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
      },
    })
  ).json();
}

export async function getTxMetadata(txHash: string) {
  const metadata = await fetch(`https://cardano-preview.blockfrost.io/api/v0/txs/${txHash}/metadata`, {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  const metadataJson = await metadata.json();
  // console.log({ metadataJson: metadataJson[0] });
  return metadataJson[0];
}

export async function getAssetMetadata(assetName: string) {
  if (assetName === "lovelace") return;

  const metadata = await fetch(`https://cardano-preview.blockfrost.io/api/v0/assets/${assetName}`, {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  const metadataJson = await metadata.json();
  // console.log({ metadataJson: metadataJson });
  return metadataJson;
}

export async function getPools() {
  const pools = await fetch("https://cardano-preview.blockfrost.io/api/v0/pools", {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  return await pools.json();
}

export async function getAccountStakeInfo(stakeAddress: string) {
  const stakeInfo = await fetch(`https://cardano-preview.blockfrost.io/api/v0/accounts/${stakeAddress}`, {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  return await stakeInfo.json();
}

export async function getPoolMetadata(poolID: string) {
  const metadata = await fetch(`https://cardano-preview.blockfrost.io/api/v0/pools/${poolID}/metadata`, {
    headers: {
      project_id: process.env.NEXT_PUBLIC_BLOCKFROST as string,
    },
  });
  return await metadata.json();
}
