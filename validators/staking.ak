use aiken/transaction.{Publish, ScriptContext, WithdrawFrom}
use staking/alias.{PubKeyHash}
use staking/util.{is_signed_by}
use string_util/cbor.{print}

/// Allow actions as long as it is signed by the `owner`
validator(owner: PubKeyHash) {
  fn stake(_redeemer: Void, context: ScriptContext) {
    let txn_signed_by_owner =
      fn() { context.transaction |> is_signed_by(owner) }

    when context.purpose is {
      Publish(_) -> txn_signed_by_owner()

      WithdrawFrom(credential) -> {
        trace print("Credential", credential)
        txn_signed_by_owner()
      }

      _ -> False
    }
  }
}
