use aiken/transaction.{ScriptContext, Spend}
use staking/alias.{PubKeyHash}
use staking/util.{is_signed_by}

/// Allow action as long as it is signed by the `owner`
validator(owner: PubKeyHash) {
  fn spend(_datum: Void, _redeemer: Void, context: ScriptContext) {
    when context.purpose is {
      Spend(_) -> context.transaction |> is_signed_by(owner)
      _ -> False
    }
  }
}
