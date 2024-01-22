use aiken/list.{has}
use aiken/transaction.{Transaction}
use staking/alias.{PubKeyHash}

pub fn is_signed_by(txn: Transaction, pkh: PubKeyHash) -> Bool {
  txn.extra_signatories |> has(pkh)
}
