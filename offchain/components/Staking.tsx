import { Constr, Data, Lucid, MintingPolicy, Script, SpendingValidator, UTxO, applyDoubleCborEncoding, applyParamsToScript, fromText } from "lucid-cardano";
import { useEffect, useState } from "react";
import {
  getAccountStakeInfo,
  getAssetMetadata,
  getLatestBlockInfo,
  getPoolMetadata,
  getPools,
  getScriptCBOR,
  getTxMetadata,
  getTxUTxOs,
} from "../utils/blockfrost";

declare type TokenUTxO = {
  utxo: UTxO;
  initial_mint_tx_hash: string;
  policyID: string;
  assetName: string;
  metadata: any;
};

const Staking = (props: { lucid: Lucid; setActionResult: (actionResult: string) => void }) => {
  const lucid = props.lucid;
  const setActionResult = props.setActionResult;

  const [loaded, setLoaded] = useState(false);
  const [contractAddress, setContractAddress] = useState(
    "addr_test1xrmst54l6npgg26vqz3wtj8fp4a8zd8pk3t7xwdcg9yf8xh6xk8ltdp25wrw5tqmzck9qf7hhk9atku4aedgdah2hkqsh6ukz8"
  );
  const [stakeInfo, setStakeInfo] = useState<Record<string, any>>();
  const [poolInfo, setPoolInfo] = useState<Record<string, any>>();

  useEffect(() => {
    setLoaded(true);

    if (contractAddress) {
      const stakingCredential = lucid.utils.stakeCredentialOf(contractAddress);
      const rewardAddress = lucid.utils.credentialToRewardAddress(stakingCredential);

      getAccountStakeInfo(rewardAddress).then((info) => {
        setStakeInfo(info);

        if (info.pool_id) {
          getPoolMetadata(info.pool_id).then((data) => {
            setPoolInfo(data);
          });
        }
      });
    }
  }, []);

  const compiledCode = {
    spending:
      "58b201000032323232323232322322225333007323253330093370e90010008991919198008008011129998088008a5013232533300f3371e00401829444cc010010004c050008dd718090009bac300f301030103010301030103010301030103009001300e300800314a060146ea8004c030c034c018004526153300849011856616c696461746f722072657475726e65642066616c73650013656375c0024600a6ea80055cd2b9c5573aaae7955cfaba157441",
    staking:
      "5901d801000032323232323232323223222533300632323253330093370e90030008a8018a99980499b87480100044c8c94cc030c8c8dcc9919199800800801a4500222533301500210011323233300500500153330133370e6e3400d200013730004266e2800ccdc50031b98002301900337326eb8c05c008dcc249003301137526e60c0052210a43726564656e7469616c003301137526e61241023a20003301137526e60c0052210122003301137526e60c8dcc991919980080080124410022253330113371000490000800899191919980300319b8100548008cdc599b80002533301433710004900a0a40c0290570099b8b33700002a66602866e200052014148180520ae010043370c004901019b8300148080cdc700280119b81371a00290011bb30023301137526e60c00522010122004bd7011b99001150053010001300800214a060146ea8004c034c038c0180084c8c8c8cc004004008894ccc03800452809919299980619b8f00200914a226600800800260240046eb8c040004dd61806980718071807180718071807180718071803000980618028008a4c2a6600e92011856616c696461746f722072657475726e65642066616c73650013656375c0024600a6ea80055cd2b9c5573aaae7955cfaba05742ae881",
  };

  const voidData = Data.to(new Constr(0, []));

  const createWallet = async () => {
    try {
      console.log("CreateWallet():");
      if (lucid) {
        const userAddress = await lucid.wallet.address();
        console.log({ userAddress: userAddress });

        const utxos = await lucid.wallet.getUtxos();
        console.log({ utxos: utxos });
        if (!utxos.length) {
          throw { emptyWalletAddress: "No UTxO to consume." };
        }

        // Payment part (the spending script)
        const spendingValidator = applyParamsToScript(compiledCode.spending, [lucid.utils.paymentCredentialOf(userAddress).hash]);
        const spendingValidatorScript: SpendingValidator = {
          type: "PlutusV2",
          script: applyDoubleCborEncoding(spendingValidator), // cborHex
        };

        // Staking part (the staking script)
        const stakingValidator = applyParamsToScript(compiledCode.staking, [lucid.utils.paymentCredentialOf(userAddress).hash]);
        const stakingValidatorScript: Script = {
          type: "PlutusV2",
          script: applyDoubleCborEncoding(stakingValidator), // cborHex
        };
        const stakingValidatorScriptHash = lucid.utils.validatorToScriptHash(stakingValidatorScript);
        const stakingValidatorScriptCredential = lucid.utils.scriptHashToCredential(stakingValidatorScriptHash);

        // Combine both the spending and staking script together
        const contractAddress = lucid.utils.validatorToAddress(
          {
            type: "PlutusV2",
            script: spendingValidator,
          },
          stakingValidatorScriptCredential
        );
        console.log({ contractAddress: contractAddress });

        const tx = await lucid
          .newTx()
          .collectFrom(utxos)
          .payToContract(
            contractAddress,
            {
              inline: voidData,
              scriptRef: spendingValidatorScript,
            },
            {
              lovelace: BigInt(0),
            }
          )
          .payToContract(
            contractAddress,
            {
              inline: voidData,
              scriptRef: stakingValidatorScript,
            },
            {
              lovelace: BigInt(0),
            }
          )
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setContractAddress(contractAddress);
        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Invalid Lucid State!" };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  const depositFunds = async () => {
    try {
      console.log(`DeppsitFunds(${contractAddress}):`);
      if (lucid && contractAddress) {
        const utxos = await lucid.wallet.getUtxos();
        console.log({ utxos: utxos });
        if (!utxos.length) {
          throw { emptyWalletAddress: "No UTxO to consume." };
        }

        const tx = await lucid
          .newTx()
          .collectFrom(utxos)
          .payToContract(
            contractAddress,
            {
              inline: voidData,
            },
            {
              lovelace: BigInt(100_000000),
            }
          )
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Still loading some data, please try again later..." };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  const withdrawFunds = async () => {
    try {
      console.log(`WithdrawFunds(${contractAddress}):`);
      if (lucid && contractAddress) {
        const userAddress = await lucid.wallet.address();
        console.log({ userAddress: userAddress });

        const utxos = await lucid.utxosAt(contractAddress);
        console.log({ utxos: utxos });
        if (!utxos.length) {
          throw { emptyContractAddress: "No UTxO in contract." };
        }

        const tx = await lucid
          .newTx()
          .readFrom(utxos.filter((utxo) => utxo.scriptRef))
          .collectFrom(
            utxos.filter((utxo) => !utxo.scriptRef),
            voidData
          )
          .addSigner(userAddress)
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Still loading some data, please try again later..." };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  const registerStake = async () => {
    try {
      if (lucid && stakeInfo) {
        const tx = await lucid.newTx().registerStake(stakeInfo.stake_address).complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Still loading some data, please try again later..." };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  const deregisterStake = async () => {
    try {
      if (lucid && stakeInfo) {
        const userAddress = await lucid.wallet.address();
        console.log({ userAddress: userAddress });

        const utxos = await lucid.utxosAt(contractAddress);
        console.log({ utxos: utxos });
        if (!utxos.length) {
          throw { emptyContractAddress: "No UTxO in contract." };
        }

        const tx = await lucid
          .newTx()
          .readFrom(utxos.filter((utxo) => utxo.scriptRef))
          .deregisterStake(stakeInfo.stake_address, voidData)
          .addSigner(userAddress)
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Still loading some data, please try again later..." };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  const delegateStake = async () => {
    try {
      if (lucid && stakeInfo) {
        const userAddress = await lucid.wallet.address();
        console.log({ userAddress: userAddress });

        const utxos = await lucid.utxosAt(contractAddress);
        console.log({ utxos: utxos });
        if (!utxos.length) {
          throw { emptyContractAddress: "No UTxO in contract." };
        }

        const pools = await getPools();
        console.log({ delegateToPool: pools[0] });

        const tx = await lucid
          .newTx()
          .readFrom(utxos.filter((utxo) => utxo.scriptRef))
          .delegateTo(stakeInfo.stake_address, pools[0], voidData)
          .addSigner(userAddress)
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Still loading some data, please try again later..." };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  const withdrawStake = async () => {
    try {
      if (lucid && stakeInfo) {
        const userAddress = await lucid.wallet.address();
        console.log({ userAddress: userAddress });

        const utxos = await lucid.utxosAt(contractAddress);
        console.log({ utxos: utxos });
        if (!utxos.length) {
          throw { emptyContractAddress: "No UTxO in contract." };
        }

        const delegation = await lucid.delegationAt(stakeInfo.stake_address);
        console.log({ delegation: delegation });

        const tx = await lucid
          .newTx()
          .readFrom(utxos.filter((utxo) => utxo.scriptRef))
          .withdraw(stakeInfo.stake_address, delegation.rewards, voidData)
          .addSigner(userAddress)
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log({ txHash: txHash });

        setActionResult(`TxHash: ${txHash}`);
        // window.location.reload();
        return txHash;
      }
      throw { error: "Still loading some data, please try again later..." };
    } catch (x) {
      setActionResult(JSON.stringify(x));
    }
  };

  return !loaded ? (
    <></>
  ) : (
    <div>
      {/* CreateWallet */}
      <button className="btn btn-primary m-5" onClick={createWallet}>
        Create Wallet
      </button>

      {contractAddress && (
        <>
          {/* DepositFunds */}
          <button className="btn btn-secondary m-5" onClick={depositFunds}>
            Deposit Funds
          </button>

          {/* WithdrawFunds */}
          <button className="btn btn-secondary m-5" onClick={withdrawFunds}>
            Withdraw Funds
          </button>

          {/* Contract Info */}
          <p>{`${contractAddress}`}</p>

          {/* Staking Dashboard*/}
          {stakeInfo && (
            <div>
              {/* Staking Info */}
              <pre>{`${JSON.stringify(stakeInfo, null, 2)}`}</pre>

              {/* Register Stake */}
              <button className="btn btn-primary m-5" onClick={registerStake}>
                Register Stake
              </button>

              {/* DeRegister Stake */}
              <button className="btn btn-primary m-5" onClick={deregisterStake}>
                De-Register Stake
              </button>

              {/* Delegate Stake */}
              <button className="btn btn-secondary m-5" onClick={delegateStake}>
                Delegate Stake
              </button>

              {/* Withdraw Stake Reward */}
              <button className="btn btn-secondary m-5" onClick={withdrawStake}>
                Withdraw Stake Reward
              </button>

              {/* Pool Info */}
              {poolInfo && <pre>{`${JSON.stringify(poolInfo, null, 2)}`}</pre>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Staking;
